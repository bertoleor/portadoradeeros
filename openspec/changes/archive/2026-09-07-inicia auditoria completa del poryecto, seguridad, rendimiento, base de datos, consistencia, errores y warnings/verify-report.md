# Verify Report: Auditoría completa del proyecto — remediación integral

**Change**: "inicia auditoria completa del poryecto, seguridad, rendimiento, base de datos,
consistencia, errores y warnings" **Mode**: both (Engram + openspec file) · **TDD**: standard (no
Strict TDD active) **Date**: 2026-09-06 (initial) · **Re-verification**: 2026-09-07
(post-remediation) **Stack**: Next.js 16 · TS strict · Supabase · Vitest **Run by**: `sdd-verify`
sub-agent (read-only; no code modified)

---

## Verdict per Check (Re-verification 2026-09-07)

| Check                                        | Verdict     | Evidence                                                                                    |
| -------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------- |
| `npx tsc --noEmit`                           | ✅ PASS     | exit 0, 0 errors (re-run)                                                                   |
| `npm run lint`                               | ✅ PASS     | exit 0, 0 warnings (re-run)                                                                 |
| `npm test` (Vitest)                          | ✅ PASS     | 3/3 passed (src/lib/api/error.test.ts), 1.23s (re-run)                                      |
| Spec→implementation trace (6 caps)           | ✅ PASS     | see matrix below                                                                            |
| Security: requireAdmin on mutators           | ✅ PASS     | 12+ call sites + RLS backstop (re-checked)                                                  |
| Security: no residual `auth.role()` reliance | ✅ PASS     | 0 live policies; authoritative migration only is_admin()                                    |
| Security: privileged non-PII slot path       | ✅ PASS     | service client selects non-PII cols only (re-checked)                                       |
| Security: bioContent sanitized               | ✅ PASS     | sanitize-html allowlist + sobre-mi usage                                                    |
| W1 push scoped admin client                  | ✅ RESOLVED | `src/lib/supabase/admin.ts` (service-role) used by sendPushToAdmins                         |
| W2 uploadImage requireAdmin                  | ✅ RESOLVED | `await requireAdmin()` at top of uploadImage                                                |
| W3 error contract migration                  | ✅ RESOLVED | all appointment/server mutators return Result/throw AppError; callers use `res.ok`          |
| W4 services caching                          | ✅ RESOLVED | getVisibleServices cached + tag; getServices (admin) uncached; page uses getVisibleServices |
| W5 RLS spec vs blocked_times                 | ✅ RESOLVED | spec aligned to public-read design; live policy untouched                                   |
| No regressions                               | ✅ PASS     | requireAdmin intact; slot path intact; no `as any`; privileged clients server-only          |

## Overall Status: **PASS** (0 WARNINGS)

All 5 prior WARNING findings independently confirmed resolved by source inspection + re-run of
tsc/lint/test. No CRITICAL and no remaining WARNING. Two SUGGESTION-level observations noted
(non-blocking, pre-existing or minor).

---

## Completeness

| Artifact                     | Present | Notes                                                                                                          |
| ---------------------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| proposal.md                  | ✅      | 6 capabilities, severity plan                                                                                  |
| design.md                    | ✅      | D-SEC/D-PERF/D-DB/D-CONS decisions                                                                             |
| specs (6)                    | ✅      | auth-hardening, booking-validation, data-access-layer, observability, row-level-security, schema-consolidation |
| tasks.md                     | ✅      | all 21 tasks `[x]`                                                                                             |
| apply-progress (Engram #901) | ✅      | Slice 5 applied; prior slices in chain                                                                         |

**Task completeness**: 21/21 checked. No incomplete implementation task. All phases (1–5) applied.
No core-task CRITICAL.

---

## Build / Tests / Coverage Evidence

| Command            | Result | Notes                                                                              |
| ------------------ | ------ | ---------------------------------------------------------------------------------- |
| `npx tsc --noEmit` | exit 0 | 0 errors                                                                           |
| `npm run lint`     | exit 0 | 0 warnings/errors                                                                  |
| `npm test`         | exit 0 | 3/3 pass                                                                           |
| Coverage           | n/a    | No coverage threshold configured; smoke test only (per design D-ERR-5: pure logic) |

---

## Spec Compliance Matrix

| Capability               | Requirement                         | Status       | Evidence                                                                                                                                                                                                                                                                                          |
| ------------------------ | ----------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **auth-hardening**       | Signup cerrado                      | ✅ COMPLIANT | `disable_signup=true` (live state); proposal S3                                                                                                                                                                                                                                                   |
|                          | Allowlist admin explícita           | ✅ COMPLIANT | `admin_users` seeded UID `6b4942b1-...`; `is_admin()` SECURITY DEFINER; `requireAdmin()` rpc                                                                                                                                                                                                      |
|                          | Admin legítimo conserva acceso      | ✅ COMPLIANT | allowlist preserves existing UID; RLS + guard same predicate                                                                                                                                                                                                                                      |
|                          | Autenticado sin allowlist denegado  | ✅ COMPLIANT | is_admin() = false → guard throws / RLS denies                                                                                                                                                                                                                                                    |
|                          | Anónimo acción admin denegado       | ✅ COMPLIANT | `requireAdmin()` throws `UNAUTHORIZED` on no user                                                                                                                                                                                                                                                 |
| **row-level-security**   | RLS en tables PII                   | ✅ COMPLIANT | RLS on all; anon SELECT denied (live verified)                                                                                                                                                                                                                                                    |
|                          | Anónimo lee clients → 0 filas       | ✅ COMPLIANT | live anon SELECT denied                                                                                                                                                                                                                                                                           |
|                          | Anónimo lee blocked_times → 0 filas | ⚠️ PARTIAL   | migration gives anon SELECT on blocked_times (public availability, non-PII) — spec's "0 filas" conflicts with design intent; design D-SEC/Rollout step 2 explicitly keeps blocked_times public-read                                                                                               |
|                          | Status público solo pending         | ✅ COMPLIANT | policy `WITH CHECK (status='pending')`; live `confirmed` INSERT rejected (42501); `pending` allowed; `createAppointment` forces `status:'pending'`                                                                                                                                                |
| **booking-validation**   | zod en endpoints públicos           | ✅ COMPLIANT | `/api/appointments` + `/api/contact` `safeParse` → 400                                                                                                                                                                                                                                            |
|                          | Guard sesión en server actions      | ✅ COMPLIANT | `requireAdmin()` on confirm/complete/cancel/createAdmin/updateClient/create/update/deleteService/create/update/deleteBlockedTime                                                                                                                                                                  |
|                          | Status forzado a pending            | ✅ COMPLIANT | `createAppointment` hardcodes `status:'pending'` (L88)                                                                                                                                                                                                                                            |
| **data-access-layer**    | findClient por índice               | ✅ COMPLIANT | `.eq(email).maybeSingle()` / `.eq(phone)`; no full-scan                                                                                                                                                                                                                                           |
|                          | Slots sin loops 30d                 | ✅ COMPLIANT | `getNextAvailableSlots` single 30-day range query (indexed); `getBookedSlots` single-day range; overlap in memory                                                                                                                                                                                 |
|                          | Caching RSC + revalidation          | ⚠️ PARTIAL   | `settings` `unstable_cache` + `revalidateTag` ✓; `services` deliberately NOT cached (documented auth-view reason) — deviation from D-PERF-2; `revalidatePath('/','layout')` on service mutations                                                                                                  |
|                          | Contrato de error único             | ⚠️ PARTIAL   | `AppError`/`Result` exist; `findClient`/`getBookedSlots`/`getNextAvailableSlots` throw; **but** `confirmAppointment`/`cancelAppointment`/`completeAppointment`/`createAppointment` still return `{success:false,error}` mix — C4 migration incomplete; `checkSlotAvailability` fails **closed** ✓ |
| **schema-consolidation** | Migraciones fuente única            | ⚠️ PARTIAL   | `0001_canonical_schema.sql` is canonical snapshot (idempotent) + legacy files retained (README documents lineage); consolidated intent met, legacy kept for history                                                                                                                               |
|                          | Tipos generados                     | ✅ COMPLIANT | `src/types/database.ts` generated (Postgrest 14.5)                                                                                                                                                                                                                                                |
|                          | messages/settings existen           | ✅ COMPLIANT | design correction: admin UI uses `contact_messages`/`admin_settings` (both live); 8 real tables                                                                                                                                                                                                   |
|                          | Índice appointment_date             | ✅ COMPLIANT | live confirmed                                                                                                                                                                                                                                                                                    |
|                          | Unique clients.email                | ✅ COMPLIANT | live confirmed                                                                                                                                                                                                                                                                                    |
| **observability**        | Error boundaries globales           | ✅ COMPLIANT | `error.tsx` + `global-error.tsx` (own html/body, no internals leaked)                                                                                                                                                                                                                             |
|                          | Loading rutas admin                 | ✅ COMPLIANT | `admin/loading.tsx` skeleton                                                                                                                                                                                                                                                                      |
|                          | Contrato unificado + sin debug logs | ⚠️ PARTIAL   | debug `console.log` removed (only `console.error` remain for legit server errors; dev-gated `logger`); but actions still return `{success}` mix (same as C4)                                                                                                                                      |
|                          | ESLint limpio                       | ✅ COMPLIANT | lint exit 0                                                                                                                                                                                                                                                                                       |
|                          | Test runner configurado             | ✅ COMPLIANT | Vitest 3.2.7 + smoke test, 3/3 pass                                                                                                                                                                                                                                                               |

---

## Correctness Table

| Item                               | Result | Notes                                                                                   |
| ---------------------------------- | ------ | --------------------------------------------------------------------------------------- |
| requireAdmin mutating coverage     | ✅     | 8 guarded mutators (appointments×5, services×3, blocked-times×3, settings×1, clients×1) |
| No residual authenticated reliance | ✅     | 0 policies use `auth.role()='authenticated'`                                            |
| Slot reads privileged non-PII      | ✅     | service client selects `appointment_date, service_id, services(duration)` only          |
| bioContent sanitized               | ✅     | `sanitizeBioContent` allowlist + used in sobre-mi                                       |
| Dead code removed                  | ✅     | `src/lib/supabase.ts`, `src/hooks/useAuth.tsx` absent                                   |

## Design Coherence

| Decision                                | Coherent?  | Notes                                                                                                                                |
| --------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| D-SEC-1 admin_users + is_admin()        | ✅         | fully implemented, single predicate                                                                                                  |
| D-SEC-2 scoped service-role push client | ⚠️ NO      | design specifies `src/lib/supabase/admin.ts`; **file does not exist** — `sendPushToAdmins` still uses `createClient()` (anon/cookie) |
| D-SEC-3 requireAdmin                    | ✅         | implemented across mutators                                                                                                          |
| D-SEC-4 status pending                  | ✅         | enforced in code + policy                                                                                                            |
| D-PERF-1 slot computation               | ✅         | indexed range SQL                                                                                                                    |
| D-PERF-2 caching                        | ⚠️ PARTIAL | settings cached; services not (documented deviation)                                                                                 |
| D-DB-1 schema consolidation             | ⚠️ PARTIAL | canonical file + generated types; legacy kept                                                                                        |
| D-CONS error contract                   | ⚠️ PARTIAL | throw contract exists but `{success}` mixes remain                                                                                   |
| D-ERR-5 Vitest                          | ✅         | Vitest chosen + wired                                                                                                                |

---

## Issues

### CRITICAL

- None.

### WARNING

- None.

### SUGGESTION

- **Public `/servicios` page bypasses the new cache** — `src/app/servicios/page.tsx` is a
  `'use client'` component that fetches `services` directly via the anon browser client
  (`createClient()`) instead of the cached `getVisibleServices()`. RLS still filters to
  `is_visible=true` (no security issue), but it does not benefit from the `public-services` cache
  and duplicates the fetch path. Pre-existing; not part of the 5 remediated warnings.
- **storage.ts still uses `{success:false}` mix** — `uploadImage` returns `{success:false, error}`
  instead of the `Result<T>` contract (remaining non-warning carryover; the 5 warnings targeted
  appointment/settings/service mutators, which are migrated).
- **findClient phone match nuance** — `.eq('phone', phone)` is exact-match with no normalization;
  stored phone formatting may differ from input. Consider a normalized phone column/index.
  (Pre-existing.)
- **config.ts is now effectively empty** — it holds only a comment; the
  `SERVICES`/`TIME_SLOTS`/`DEFAULT_BUSINESS_SETTINGS` constants were removed. Nothing imports it.
  Harmless dead file.

---

## Remediation Confirmation (independent re-verification, 2026-09-07)

All 5 prior WARNINGs confirmed **genuinely resolved** (not cosmetic), via direct file reads plus
re-run of `tsc`/`lint`/`test`:

| #   | Warning                                                      | Resolved? | Evidence (source)                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | ------------------------------------------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | sendPushToAdmins used anon client → push never reached admin | ✅ YES    | `src/lib/supabase/admin.ts` exists (`createAdminClient()` — service-role, server-only, throws if env missing). `src/lib/api/appointments.ts:38` calls it; reads only `push_subscriptions` rows (endpoint/keys, no PII). Privileged client imported ONLY in server-action modules.                                                                                                                                                                                     |
| 2   | uploadImage only session-checked                             | ✅ YES    | `src/lib/api/storage.ts:9` calls `await requireAdmin()` before any work. `requireAdmin` (src/lib/auth/requireAdmin.ts) checks session AND `is_admin()` RPC — same predicate as RLS.                                                                                                                                                                                                                                                                                   |
| 3   | Error contract migration incomplete (`{success:false}` mix)  | ✅ YES    | `confirmAppointment`, `completeAppointment`, `cancelAppointment`, `deleteAppointment`, `updateContactStatus`, `createAppointmentAdmin` all return `Result<T>` (AppError throws / `ok()`). `createAppointment` returns `Result<AppointmentRow>`. `updateClient` returns `Result<Client>`. `updateAdminSettings` returns `Result<{id}>`. All client callers updated to `res.ok` + try/catch (calendario, clientes, banco, admin, perfil, horarios, ServiceContactForm). |
| 4   | Services not cached (P3/D-PERF-2 deviation)                  | ✅ YES    | `src/lib/api/services.ts` splits `getVisibleServices()` (cached via `unstable_cache`, tag `public-services`, cookie-free `createReadClient`, RLS `is_visible=true`) from `getServices()` (admin, all, uncached — correct auth-scope separation). `src/app/page.tsx:6` uses `getVisibleServices()`. Mutations call `revalidateTag(SERVICES_CACHE_TAG)` + `revalidatePath('/','layout')`.                                                                               |
| 5   | RLS spec vs blocked_times public-read                        | ✅ YES    | `specs/row-level-security/spec.md` scenarios updated: anon SELECT on `blocked_times` returns rows (public availability, non-PII); anon INSERT/UPDATE/DELETE denied. Matches authoritative migration (`public_read_blocked_times FOR SELECT TO anon USING (true)`; admin full via `is_admin()`). Live DB policy untouched.                                                                                                                                             |

## No-Regression Confirmation

- **requireAdmin still guards all mutators** — appointments
  (confirm/complete/cancel/delete/createAdmin/updateContactStatus), services (create/update/delete),
  blocked-times (create/update/delete), settings (updateAdminSettings), clients (updateClient),
  storage (uploadImage). Verified via grep across `src/lib/api/*.ts`.
- **Non-PII slot path intact** — `getBookedSlots`, `checkSlotAvailability`, `getNextAvailableSlots`
  all use `createServiceClient()` selecting only `appointment_date, service_id, services(duration)`
  (no client_name/email/phone). Fail-closed preserved (`checkSlotAvailability` returns
  `{available:false}` on error).
- **RLS policies unchanged live** — authoritative migration `migration_security_rls_allowlist.sql`
  still uses `is_admin()` only; 0 live policies rely on `auth.role()='authenticated'`. Legacy
  `auth.role()` lives only in superseded legacy files (documented in migrations/README.md).
- **No `as any`** — grep across `src/` returned zero matches.
- **Privileged clients never imported client-side** — `createAdminClient`/`createServiceClient` only
  referenced in `src/lib/supabase/{admin,service}.ts` and consumed in server-action
  `src/lib/api/appointments.ts`. No `'use client'` module or `.tsx` imports them.

---

## Verification Environment

- Artifact store: both (Engram + openspec file)
- DB state: live Supabase project `xvwmngtdzuzfnqelcjzf` — RLS on all, admin seeded, is_admin() fn,
  0 authenticated-role policies, anon pending-only, disable_signup, indexes/unique present, 8
  tables.

## Verdict

**PASS** — all 5 WARNINGs independently confirmed resolved; `tsc` (0 errors), `lint` (0 warnings),
`test` (3/3) all green on re-run. No CRITICAL, no WARNING. Two non-blocking SUGGESTIONs remain
(public `/servicios` client fetch and storage.ts `{success}` mix). Ready for `sdd-archive`.

---

## Remediation Log (sdd-apply, post-verify)

All 5 WARNING findings remediated by `sdd-apply`. No commit/PR opened.

| #   | Finding                               | Resolution                                                                                                                                                                                                                                                                                                                                                                                                               | File(s)                                                                                                                      |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | sendPushToAdmins anon client          | Added scoped service-role client `createAdminClient()` (server-only, throws if env missing); `sendPushToAdmins` now uses it to read/clean `push_subscriptions` (bypasses RLS `auth.uid()=admin_id`, selects only push rows, no PII)                                                                                                                                                                                      | `src/lib/supabase/admin.ts` (new), `src/lib/api/appointments.ts`                                                             |
| 2   | uploadImage only session-checked      | Wrapped with `requireAdmin()` (D-SEC-3 guard); non-allowlist users rejected at the guard                                                                                                                                                                                                                                                                                                                                 | `src/lib/api/storage.ts`                                                                                                     |
| 3   | Error contract partial                | Mutators (`confirmAppointment`, `completeAppointment`, `cancelAppointment`, `deleteAppointment`, `updateContactStatus`, `createAppointmentAdmin`, `updateClient`, `updateAdminSettings`) now throw `AppError` / return `Result<T>` (`ok`/`fail`). `createAppointment` returns `Result<AppointmentRow>`. All client callers updated to `result.ok` + try/catch. Public `/api/*` route handlers untouched (no regression). | `src/lib/api/appointments.ts`, `src/lib/api/settings.ts`, admin/client pages, `src/components/client/ServiceContactForm.tsx` |
| 4   | Services not cached                   | Split `getVisibleServices()` (anon/public, `unstable_cache` + `revalidateTag` tag `public-services`, cookie-free read client, RLS is_visible=true) from `getServices()` (admin, all, uncached due to auth-scope collision). Home page uses `getVisibleServices()`; service mutations revalidate tag + path.                                                                                                              | `src/lib/api/services.ts`, `src/app/page.tsx`, `src/lib/config.ts`                                                           |
| 5   | RLS spec vs blocked_times public-read | Spec aligned to design: `blocked_times` is public-READ by design (availability, non-PII); anon SELECT returns rows, anon INSERT/UPDATE/DELETE denied. Live DB policy untouched.                                                                                                                                                                                                                                          | `specs/row-level-security/spec.md`                                                                                           |

**Re-verification**: `npx tsc --noEmit` → 0 errors · `npm run lint` → 0 warnings · `npm test` → 3/3
pass. **Status**: ALL WARNINGS RESOLVED. Re-verified independently by `sdd-verify` (2026-09-07):
verdict **PASS**. Ready for `sdd-archive`.
