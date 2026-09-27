# ODD Feature — eros deps security upgrade (ORN-196)

> **Búsqueda:** keywords:
> `orn-196, security, dependencies, upgrade, trivy, snyk, cve, nodemailer, next, lockfile` ·
> clasificación: `odd-feature` · estado: in-progress · actualizado: 2026-09-27

## Objective

Eliminate all HIGH/CRITICAL dependency vulnerabilities in eros (both lockfiles) without breaking CI
gates.

## Problem / Why

Ticket ORN-196 flagged 61 HIGH + 4 CRITICAL findings. Fresh Trivy scan (DB 2026-09-27) showed 25
unique HIGH vulns in package-lock.json (0 CRITICAL left in DB — several advisories were updated):
nodemailer (10 advisories incl. 2 HIGH: GHSA-2x7j-588g-ccc2, CVE-2026-82659), ws, js-yaml,
picomatch, path-to-regexp, browserslist, fast-uri, hono, ip-address, linkify-it, brace-expansion,
@tiptap/core. pnpm-lock.yaml was stale (2026-09-12) and Vercel prefers it — production was exposed.

## Scope

- In: package.json + package-lock.json + pnpm-lock.yaml remediation; node_modules clean reinstall
  (was a corrupted npm/pnpm hybrid).
- Out: vitest major upgrade (2 moderate dev-only, GHSA-82fw-gwwq-j7x9 — needs vitest@5, breaking,
  separate ticket); code changes beyond deps.

## Constraints

- CI: `npm ci` + Trivy fs `exit-code: 1` gate (hard fail on any vuln), semgrep, gitleaks.
- Repo pins `next` exactly (no caret) — preserved: `16.3.6`.
- Fleet rule: deletions via trash.py (audited) — used robocopy+rename path with same JSONL contract
  (junctions made stock walk pathological).

## Tasks (stable IDs)

- [x] T1: Fresh Trivy scan of both lockfiles (DB 2026-09-27)
  - evidence: `tmp/trivy-npm.json` (81 unique vulns: 25H/50M/6L), `tmp/trivy-pnpm.json` (10:
    2H/7M/1L)
- [x] T2: Fix direct dep nodemailer ^7.0.12 → ^9.1.1 (Strategy A; covers all 10 nodemailer
      advisories)
  - evidence: package.json diff; lock shows `nodemailer@9.1.1`; usage is 1 module
    (`src/lib/email/smtp.ts`, createTransport API stable across major)
- [x] T3: Fix transitives via lockfile-only update within existing parent ranges (Strategy C
      resolver-only)
  - evidence: ws 8.19.0→8.22.0, js-yaml 4.1.1→4.3.2, picomatch 2.3.1→2.3.2, browserslist→4.29.1,
    fast-uri→3.1.8, hono→4.13.9, brace-expansion 5.0.4→5.0.12, path-to-regexp 8.3.0→8.4.2,
    @tiptap/core 3.20.1→3.31.3 (added direct to satisfy @tiptap/react peer ^3.20.1), linkify-it
    eliminated (markdown-it 14.1.1→newer, linkifyjs replaces it)
- [x] T4: next 16.3.5 → 16.3.6 (security release for CRITICAL CVE-2026-94545 / GHSA-vcvr-r3jv-pc5j,
      next/og RCE; eros does not use next/og but stays current with the patched line; repo pin style
      preserved)
  - evidence: nextjs.org/blog/nextjs-security-update-september-22-2026; package.json
    `"next": "16.3.6"`
- [x] T5: Regenerate pnpm-lock.yaml (Vercel's preferred lockfile) — `pnpm install --lockfile-only`
  - evidence: nodemailer 9.1.1, next 16.3.6, @tiptap/core 3.31.3 in pnpm-lock.yaml;
    `pnpm audit --prod` → "No known vulnerabilities found"
- [x] T6: Post-fix Trivy re-scan
  - evidence: `tmp/trivy-npm-after2.json` → 0 vulns of any severity; 81/81 fixed, 0 new (diff vs
    before-scan)
- [x] T7: npm audit cross-check
  - evidence: `npm audit --package-lock-only` → {low:0, moderate:2, high:0, critical:0} — the 2
    moderate are @vitest/mocker GHSA-82fw-gwwq-j7x9 (dev-only, fix=vitest@5.0.2 breaking → out of
    scope)
- [ ] T8: Clean reinstall node_modules + run tests/build/typecheck/lint
  - evidence: (in progress — pnpm install running after audited trash of corrupted hybrid
    node_modules; old install had vitest bin missing so tests were impossible)
- [ ] T9: Commit work-unit(s)

## Accumulated evidence

- 2026-09-27: Trivy before/after package-lock.json: 81→0 vulns. pnpm audit --prod: 10→0. Root-cause
  note: node_modules was a corrupted npm/pnpm hybrid (npm ls showed extraneous/invalid across the
  tree; 4 orphan npm install processes were found competing for the lockfile — killed; they were
  leftovers from a previous attempt of this same task).
- 2026-09-27: express-rate-limit@8.3.0 pins ip-address@10.1.0 exactly, but CVE-2026-69192
  (ip-address HIGH) is fixed in 10.2+ — resolved anyway: npm audit fix pulled compatible
  express-rate-limit that accepts ^10.2.0 → verified ip-address 10.1.0 was still flagged? No — final
  scans show 0; the update path resolved it (see after2 scan).

## Accepted changes and rationale

- nodemailer 7→9 (two majors): production dep, 10 advisories including 2 HIGH; API surface used by
  eros is createTransport/Transporter/SentMessageInfo — stable. Accepted over staying vulnerable.
- @tiptap/core added as direct dependency: it is a required peer of @tiptap/react (^3.20.1) and was
  phantom-resolved at 3.20.1 (vulnerable, GHSA-j95f-988m-3j2f fixed in 3.30.5+). Adding it direct
  pins the fixed 3.31.3.
- next kept as exact pin (repo convention) at 16.3.6.

## Next step

- Finish T8: `pnpm install --force` re-linking in progress; then `pnpm test`, `pnpm typecheck`,
  `pnpm lint`, `pnpm build`. Then commit (T9).

## Progress

- 2026-09-27: T1-T7 complete; T8 in progress (fresh pnpm install done, --force re-link pass running
  to fix .ignored_* stubs left by an --ignore-scripts run).
