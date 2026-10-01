import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * EROS-D2 wiring contract: every production caller must import email senders
 * from the dispatcher '@/lib/email' — never from a concrete provider module
 * ('@/lib/email/resend' | '@/lib/email/smtp') directly.
 *
 * Why: EMAIL_PROVIDER=resend|smtp only takes effect if the dispatch happens
 * in src/lib/email/index.ts. A caller that imports a provider directly
 * silently ignores the SMTP fallback (that is exactly the defect this test
 * guards against — it was shipped once and found by audit EROS-D2).
 *
 * If a module legitimately needs a provider-only export (e.g. a type or a
 * test helper), re-export it from the dispatcher and import from there.
 *
 * fs paths here derive only from this test file's `import.meta.url` plus
 * literal segments — never from user or environment input — so the
 * non-literal-filename rule is disabled for the static walk below.
 */
/* eslint-disable security/detect-non-literal-fs-filename */
const SRC_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const EMAIL_DIR = join(SRC_ROOT, 'lib', 'email');

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else if (/\.tsx?$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

const violations: string[] = [];
for (const file of walk(SRC_ROOT)) {
  // Dispatcher internals may (and must) import the concrete providers.
  if (file.startsWith(EMAIL_DIR)) {
    continue;
  }
  // Tests mock provider modules legitimately.
  if (/\.test\.tsx?$/.test(file)) {
    continue;
  }
  const content = readFileSync(file, 'utf8');
  if (/from\s+['"]@\/lib\/email\/(resend|smtp)['"]/.test(content)) {
    violations.push(relative(SRC_ROOT, file));
  }
}
/* eslint-enable security/detect-non-literal-fs-filename */

describe('email dispatcher wiring (EROS-D2)', () => {
  it('production code imports email senders only via @/lib/email dispatcher', () => {
    expect(
      violations,
      `callers importing a provider directly (must use '@/lib/email'): ${violations.join(', ')}`
    ).toEqual([]);
  });
});
