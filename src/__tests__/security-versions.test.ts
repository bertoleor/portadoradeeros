import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

/**
 * Security version floors — ORN-213 upgrade wave (Oct-2026).
 *
 * Guards both sources of truth against downgrades below the minimum
 * patched releases:
 * - the installed package in node_modules (what dev/build actually runs)
 * - package-lock.json (what CI installs via `npm ci`; pnpm-lock.yaml is
 *   kept in sync by the lockfile regen step of the same slice)
 *
 * Floors:
 * - next >= 16.4.1    CVE-2026-96889 (Image Optimization / next-og RCE, CVSS 9.5)
 *                    + GHSA-p3m5-59mp-jv5r (Server Actions DoS)
 * - react >= 19.2.9   GHSA-xqc2-xf4c-x3h3 + GHSA-h3gv-c5rc-p453 (Oct-14 advisories)
 * - react-dom >= 19.2.9 (pairs with react)
 */

const require_ = createRequire(import.meta.url);

type PackageLock = {
  packages?: Record<string, { version?: string }>;
};

function installedVersion(pkg: string): string {
  const entry = require_.resolve(pkg);
  // Walk up from the resolved entry to the package manifest: entrypoints
  // like next's dist/server/*.js live below the package root.
  let dir = dirname(entry);
  for (let i = 0; i < 6; i += 1) {
    const manifestPath = join(dir, "package.json");
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(
        readFileSync(manifestPath, "utf8"),
      ) as { name?: string; version?: string };
      if (manifest.name === pkg) return manifest.version ?? "0.0.0";
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`could not locate package.json for ${pkg} from ${entry}`);
}

function lockfileVersion(pkg: string): string {
  const lock = JSON.parse(
    readFileSync(join(process.cwd(), "package-lock.json"), "utf8"),
  ) as PackageLock;
  const entry = lock.packages?.[`node_modules/${pkg}`];
  if (!entry?.version) throw new Error(`package-lock.json has no entry for ${pkg}`);
  return entry.version;
}

/** Numeric compare of dotted release versions (x.y.z), prerelease-agnostic. */
function versionFloor(version: string, floor: string): number {
  const parse = (v: string) =>
    v
      .split("-")[0]
      .split(".")
      .map((n) => Number.parseInt(n, 10) || 0);
  const [a, b] = [parse(version), parse(floor)];
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

function expectAtFloor(pkg: string, floor: string): void {
  expect(
    versionFloor(installedVersion(pkg), floor),
    `${pkg} installed ${installedVersion(pkg)} must be >= ${floor}`,
  ).toBeGreaterThanOrEqual(0);
  expect(
    versionFloor(lockfileVersion(pkg), floor),
    `${pkg} in package-lock.json ${lockfileVersion(pkg)} must be >= ${floor}`,
  ).toBeGreaterThanOrEqual(0);
}

describe("security version floors (ORN-213)", () => {
  it("next >= 16.4.1 (CVE-2026-96889 RCE + Server Actions DoS)", () => {
    expectAtFloor("next", "16.4.1");
  });

  it("react >= 19.2.9 (GHSA-xqc2-xf4c-x3h3 / GHSA-h3gv-c5rc-p453)", () => {
    expectAtFloor("react", "19.2.9");
  });

  it("react-dom >= 19.2.9 (pairs with react advisory fixes)", () => {
    expectAtFloor("react-dom", "19.2.9");
  });
});
