/* eslint-disable security/detect-non-literal-fs-filename -- this test writes
   only to its own mkdtempSync fixture dir; every path is built from tmpdir()
   and no external input reaches these fs calls. */
import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * ORN-136 (t_ver3) — Fase 2 gate: the pre-commit hook must propagate lint-staged
 * failures (fail-closed). Guards two regressions:
 *  1. The hook swallowing errors (`npx lint-staged 2>/dev/null || … || true`).
 *  2. The hook not being tracked at all — fresh clones of main had no local
 *     protection (gitleaks/lint-staged only ran in CI).
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const hookPath = path.join(repoRoot, '.husky', 'pre-commit');

/**
 * Runs the real hook in an isolated temp directory with a stubbed
 * `lint-staged`. The temp dir is a real (tiny) git repo so gitleaks behaves
 * legitimately: it scans the staged stub when installed (exit 0, no secrets)
 * or hits its documented skip branch when absent (CI covers gitleaks).
 */
function runHookAgainstStub(lintStagedExitCode: number): number {
  const dir = mkdtempSync(path.join(tmpdir(), 'eros-precommit-'));
  try {
    execFileSync('git', ['init', '--quiet'], { cwd: dir, stdio: 'pipe' });
    copyFileSync(hookPath, path.join(dir, 'pre-commit'));
    const binDir = path.join(dir, 'node_modules', '.bin');
    mkdirSync(binDir, { recursive: true });
    const stub = path.join(binDir, 'lint-staged');
    writeFileSync(stub, `#!/usr/bin/env sh\nexit ${lintStagedExitCode}\n`);
    chmodSync(stub, 0o755);
    execFileSync('git', ['add', 'pre-commit', 'node_modules'], { cwd: dir, stdio: 'pipe' });
    const result = spawnSync('sh', ['pre-commit'], {
      cwd: dir,
      encoding: 'utf8',
    });
    if (result.error) {
      throw new Error(`could not run sh to execute the hook: ${String(result.error.message)}`);
    }
    return result.status ?? -1;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('pre-commit hook (ORN-136 t_ver3 — fail-closed gate)', () => {
  it('is tracked in git so fresh clones get local protection', () => {
    expect(() =>
      execFileSync('git', ['ls-files', '--error-unmatch', '.husky/pre-commit'], {
        cwd: repoRoot,
        stdio: 'pipe',
      })
    ).not.toThrow();
  });

  it('contains no failure-swallowing fallback (`|| true`)', () => {
    const hook = readFileSync(hookPath, 'utf8');
    expect(hook).not.toContain('|| true');
  });

  it('blocks the commit when lint-staged fails (exit code propagated)', () => {
    expect(runHookAgainstStub(1)).toBe(1);
  }, 180_000);

  it('lets the commit through when lint-staged passes', () => {
    expect(runHookAgainstStub(0)).toBe(0);
  }, 180_000);
});
