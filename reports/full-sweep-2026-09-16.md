# EROS full sweep — 2026-09-16 (branch `feat/rls-phase10`)

## 1. Tree (116 files under `src/`)

- `src/app/` — public pages (`/`, `/servicios`, `/contacto`, `/sobre-mi`, legal pages) + `/admin/*` (calendario, clientes, mensajes, servicios, configuracion/*) + API (`/api/contact`, `/api/cron/reminders`, `/api/admin/push/subscribe`) + `robots.ts`, `sitemap.ts`, PWA assets.
- `src/components/` — `client/` (booking flow), `admin/`, `ui/` (shadcn), `pwa/`.
- `src/lib/` — `api/`, `auth/requireAdmin`, `email.ts` (legacy EmailJS, intact), `email/resend.ts` (canonical sender), `supabase/*`, `sanitize`, `spam-protection`, `whatsapp`, `logger`, `socials`.
- `src/fonts/` — self-hosted Geist + Playfair Display (no Google Fonts network dep).
- `src/types/`, `src/proxy.ts`, `src/app/globals.css` (455 lines, Tailwind v4).

## 2. gitignore — PASS

`.env*`, `node_modules`, `.next/`, `*.tsbuildinfo`, `next-env.d.ts`, `.vercel` all ignored. Verified `git check-ignore .env.local` → ignored. No secrets in tracked files (grep for keys/service_role hits: none outside `process.env` references and test mocks).

## 3. Docs — no move without owner

`docs/` canonical baseline exists (`01–07`, `adr/`, `STATUS.md`). 14 legacy `AUDITORIA_*.md` / `PLAN_*.md` / `MEJORAS_*.md` / `PROPUESTAS_*.md` files sprawl at root — `docs/STATUS.md` records consolidation as ticket EROS-C3 requiring owner OK. **Not moved** (rule: no delete/reorg without LGTM). This report lives in `reports/` per STATUS.md convention.

## 4. Gates (run 2026-09-16, branch `feat/rls-phase10` + working tree)

| Gate | Result |
|---|---|
| `tsc --noEmit` | PASS, exit 0 |
| `vitest run` | PASS — 7 files, 49/49 tests (resend 8/8, contact 6/6, spam 11/11, requireAdmin 6/6, whatsapp 5/5, sanitize 10/10, error 3/3) |
| `next build` | PASS — full route map emitted, no compile errors |
| `eslint src` | **FAIL (pre-existing)** — 130 errors / 38 warnings. Dominant: `curly` (single-statement `if` without braces, ~118 auto-fixable) in `lib/api/*`, plus `no-console` in `lib/logger.ts`. Touched files clean: `email/resend.ts` 0 problems, `api/appointments.ts` 0 errors + 5 `security/detect-object-injection` warnings (pre-existing pattern) |
| `prettier --check` (touched files) | FAIL → **fixed** with `--write` (4 files), now clean |
| `npm audit` | **1 critical** (`next` 16.1.6 < 16.3.5, request smuggling in rewrites GHSA-ggv3-7p47-pfv8) + 15 high incl. `ws` chain → **bump BLOCKED: registry installs stall in this environment (npm + pnpm both wedge, 0 progress in 15 min); manifests reverted to gated state. Remediation: `pnpm add next@16.3.5` (or npm) on a healthy network + `tsc && vitest run && next build`, separate commit.** Rest ticketed |

## 5. Findings

### P0 (fixed this sweep)
- **P0-1 — legacy EmailJS importers**: DONE in working tree (contact route, reminders cron, appointments lib all import `@/lib/email/resend`; API-compatible signatures verified, committed this sweep). `src/lib/email.ts` left intact, untouched.
- **P0-2 — staged CI referenced nonexistent `aquasec/trivy-action@master`** (correct org: `aquasecurity`). Would fail the new `security-scasbom` and `supply-sign` jobs on every run. Fixed → `aquasecurity/trivy-action@0.30.0` (tag verified via ls-remote). (`actions/checkout@v7`, `semgrep-action@v1`, `gitleaks-action@v2`, `cosign-installer@v3` all verified to exist.)
- **P0-3 — prettier gate red on 4 touched files** → `--write` applied, formatting-only diff confirmed.

### P1 (ticketed, not touched)
- **P1-1 — eslint `curly` debt (130 errors)**: repo-wide single-statement `if`s. Auto-fixable (`--fix`) but touches ~dozens of files → separate commit + full gates, owner-visible. (CI `lint` job would fail on main.)
- **P1-2 — remaining `npm audit` high/criticals** (`ws` 8.x chain via transitive dep, etc.): `npm audit fix` non-breaking pass in a dedicated branch + gates.
- **P1-3 — root docs sprawl** (EROS-C3, needs owner OK): consolidate 14 legacy root `.md` into `docs/`.
- **P1-4 — Resend still UNVERIFIED / test mode** (`onboarding@resend.dev`, smoke tests to `delivered@resend.dev` only): domain verification + sender approval requires owner action; no real-client sends until then.
- **P1-5 — `security/detect-object-injection` warnings** in `lib/api/appointments.ts` (dynamic key access): review, no known exploit path (keys are internal constants).
- **P1-6 — RLS phase-10 migration application status** on the live project unverified from here: confirm `migrations/add_rls_phase10.sql` applied to prod Supabase before merging branch.

## 6. Tickets (owner by role)

| Ticket | Owner | Scope |
|---|---|---|
| EROS-DEPS-P0 — `next` 16.1.6 → 16.3.5 (critical GHSA-ggv3-7p47-pfv8), healthy network + full gates | Dev (urgent) | P0-blocked |
| EROS-LINT — `eslint --fix` + full gates | Dev | P1-1 |
| EROS-DEPS — `npm audit fix`, dedicated branch | Dev | P1-2 |
| EROS-C3 — root docs consolidation | Owner + Dev | P1-3 (needs owner OK) |
| EROS-DOMAIN — Resend domain verify + sender approval | Owner (only she can) | P1-4 |
| EROS-RLS — confirm phase-10 migration applied on live DB | Dev + Owner | P1-6 |
| EROS-SEC — object-injection warnings review | Dev | P1-5 |

## 7. Fixes committed (this sweep)

1. `aquasec/trivy-action@master` → `aquasecurity/trivy-action@0.30.0` (2 jobs).
2. Prettier formatting on `resend.ts`, `resend.test.ts`, `cron/reminders/route.ts`, `api/appointments.ts`.
3. Commit includes the previously-uncommitted Resend importer redirect (contact, reminders, appointments) + `resend` dep + new `src/lib/email/` module + this report.
4. NOT committed: `next` 16.1.6 → 16.3.5 bump (installer wedged; see EROS-DEPS-P0 ticket below).

## 8. Pending owner LGTM (NOT done)

Real-client email sends, Resend domain verification, docs consolidation (EROS-C3), any prod deploy/merge to `main`, payments/auth changes.
