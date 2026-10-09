> Parte de: [[odd/tasks/README|ODD Hub (eros)]] · Relacionados: [[docs/F0-2026-09-27|F0 inventory]],
> [[tests/e2e/booking|Booking E2E doc]]

# ODD Feature — e2e-booking-happy-path (ORN-133)

> **Búsqueda:** keywords: `orn-133, e2e, booking, happy path, playwright, supabase stub` ·
> clasificación: `odd-feature` · estado: closed (retroactive doc) · actualizado: 2026-09-29

## Objective

Verify the public booking wizard end to end (visitor books a tarot session and reaches "Turno
Solicitado") with a Playwright E2E suite that runs locally and in CI, against a zero-dependency
Supabase REST stub — no real backend, no real email/push.

## Problem / Why

The F0-2026-09-27 inventory (§6, quick win #1) found the CI `e2e` job ran `playwright test` with no
config and no specs: a broken public booking flow (the production-critical P0 path — booking first)
would ship completely unnoticed.

## Scope

- In: `playwright.config.ts`, PostgREST stub server (`tests/e2e/server.mjs`), page object
  (`tests/e2e/pages/booking-page.ts`), spec `BOOKING-E2E-001`, E2E doc (`tests/e2e/booking.md`),
  `.gitignore` entries for playwright reports.
- Out: real Supabase/production credentials, email/push delivery, multi-step wizard variants (error
  branches), admin flows. Pre-existing src lint debt (145 errors).

## Constraints

- TDD strict mode active (runner: `npx playwright test` + `npx vitest run`).
- Browser-level `page.route()` cannot intercept server-side fetches → the Supabase stub must be a
  real HTTP server (`127.0.0.1:54321`).
- `next dev` merges `.env.local` into the child env → the stub must OVERRIDE all real email/push
  credentials or E2E runs touch production services.

## Tasks (stable IDs)

- [x] T1: Playwright config with `webServer` spawning the Supabase REST stub
  - evidence: `playwright.config.ts` (commit 9e1209d) — webServer `tests/e2e/server.mjs`, port
    54321, reuseExistingServer
- [x] T2: Zero-dep PostgREST stub (services, admin_settings, appointments, auth) on 127.0.0.1:54321
      that spawns `next dev` with stub Supabase creds
  - evidence: `tests/e2e/server.mjs` (commit 9e1209d, 229 lines) — also overrides RESEND_API_KEY /
    SMTP_* / VAPID_* to neutralize real email/push
- [x] T3: Page object for the booking wizard
  - evidence: `tests/e2e/pages/booking-page.ts` (commit 9e1209d, 141 lines)
- [x] T4: Spec BOOKING-E2E-001 — happy path 4 steps until "Turno Solicitado"
  - evidence: `tests/e2e/booking.spec.ts` (commit 9e1209d); test doc `tests/e2e/booking.md`
- [x] T5: E2E green in CI trigger branch + locally
  - evidence: run 2026-09-28: `npx playwright test` → 1 passed (2 local runs); unit 69/69 PASS;
    `tsc --noEmit` PASS; eslint 0 errors on new files (commit message 9e1209d, run log
    reports/cron-runs/g0-eros-2026-09-28.md)
- [x] T6: Engram mirror of this doc
  - evidence: `mem_save` topic `odd/orn-133-e2e-booking/tasks`, project eros (this turn)

## Accumulated evidence

- 2026-09-28 (commit 9e1209d, pushed to `origin/feat/eros-deps`): E2E 1 passed (2 runs), unit 69/69,
  tsc PASS, lint 0 errors on new files, gitleaks PASS (pre-commit hook). RDD receipt 2c3832da3b05
  (base 3e9edf8f, 9 files, 611 changed lines).
- 2026-09-29: retroactive feature doc created (ticket t_23dbcd04, cierre-verifier finding — commit
  9e1209d had no odd/tasks doc; this doc closes that gap).

## Accepted changes and rationale

- Real HTTP stub instead of `page.route()`: server-side fetches (server actions) are not
  interceptable at browser level; a real local server is the only reliable seam.
- Credential override in server.mjs: first green run accidentally reached api.resend.com with the
  real RESEND_API_KEY (emails rejected, none sent). Overriding ALL email/push env vars prevents E2E
  from ever touching production. Key rotation recommended to the owner (human decision, reported
  2026-09-28).

## Next step

- None for this feature — closed. Follow-ups live in their own tickets: RDD review boundary
  (t_16a437a4), src lint debt baseline (145 errors), vitest@5 upgrade.

## Progress

- 2026-09-28: feature implemented and verified — commit 9e1209d (611 lines, 9 files), pushed to
  origin/feat/eros-deps.
- 2026-09-29: retroactive doc created per cierre-verifier finding (t_23dbcd04); feature confirmed
  closed.
