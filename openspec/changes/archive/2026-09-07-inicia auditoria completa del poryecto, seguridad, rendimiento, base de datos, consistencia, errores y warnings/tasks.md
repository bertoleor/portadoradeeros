# Tasks: Auditoría completa — remediación integral

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2400 total (migrations ~700, generated types ~900, code ~800) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 5 stacked PR slices |
| Delivery strategy | force-chained |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | PR | Base | Note |
|------|------|-----|------|------|
| 1 | Close signup + allowlist + RLS | PR 1 | main | Security lands first (S3→S1) |
| 2 | Auth guard + zod validation + dead-code cleanup | PR 2 | main | Depends on PR 1 (is_admin()) |
| 3 | Schema consolidation + generated types | PR 3 | main | Generated types ~900 LOC → size:exception flag |
| 4 | Data access: indexed queries + caching + error contract | PR 4 | main | Depends on PR 3 (index/types) |
| 5 | Observability: boundaries + loading + lint + test runner | PR 5 | main | Independent; last |

## Phase 1: Security — close exposure (S3/S1)

> **SLICE 1 APPLY — DONE (sdd-apply, 2026-09-06): live-applied via Management API
> + verified.** `migrations/migration_security_rls_allowlist.sql` applied to
> `xvwmngtdzuzfnqelcjzf`; signup closed (`disable_signup=true`). Verified:
> `admin_users` seeded (UID `6b4942b1-...`), `is_admin()` SECURITY DEFINER exists,
> 0 policies still use `auth.role()='authenticated'`, anon SELECT denied on
> `clients`/`appointments`/`contact_messages`, anon INSERT `status='confirmed'`
> rejected (42501), `status='pending'` allowed. `blocked_times`/`admin_settings`
> remain publicly readable by design.

- [x] 1.1 Set `disable_signup=true` in Supabase auth config; document in `.env.example` (S3)
- [x] 1.2 Migration: create `admin_users` table + seed UID `6b4942b1-8ac1-4462-b234-f26e13126d76` + `is_admin()` SECURITY DEFINER fn (S3)
- [x] 1.3 Migration: ENABLE RLS + policies on `clients`/`appointments`/`blocked_times` — admin CRUD via `is_admin()`, anon SELECT denied (S1)
- [x] 1.4 Migration: RLS on `contact_messages`/`admin_settings` — anon denied (S1)
- [x] 1.5 Verify anon HTTP returns 0 rows / denial on all 5 tables

## Phase 2: Auth guard + input validation (S2/S6/S7/S8/C1/C2)

- [x] 2.1 Create `src/lib/api/error.ts` — `AppError` + `Result<T>` contract (C4)
- [x] 2.2 Create `src/lib/auth/requireAdmin.ts` — `is_admin()` RPC guard, throw on false (S2)
- [x] 2.3 Add zod schemas to `src/app/api/appointments/route.ts` + `src/app/api/contact/route.ts` (S7)
- [x] 2.4 Force `status='pending'` server-side in `createAppointment` (S6)
- [x] 2.5 Wrap mutating actions with `requireAdmin()` (confirm/complete/cancel/blocked-time/services/clients)
- [x] 2.6 Delete `src/lib/supabase.ts` (supabaseAdmin) + `src/hooks/useAuth.tsx`; unify `src/lib/supabase/*` clients (S8/C1/C2)

## Phase 3: Schema consolidation (D1/D2/D3/D4)

- [x] 3.1 Consolidate 7 `migrations/*.sql` into ordered single-source migrations; ensure `contact_messages` + `admin_settings` exist (D1)
- [x] 3.2 Add index `appointments.appointment_date` + UNIQUE `clients.email` (backfill dedupe first) (D3/D4)
- [x] 3.3 Regenerate `src/types/database.ts` via `supabase gen types typescript`; replace hand-written `Database` in `supabase.ts` (D2)

## Phase 4: Data access + caching (P1–P5/C3/C4/C5)

- [x] 4.1 Rewrite `findClient` → indexed `.eq(email/phone).maybeSingle()` (P1)
- [x] 4.2 Replace 30-day loops/JS-filter with range SQL in `getNextAvailableSlots`/`getBookedSlots`/`getOccupiedWindowsForDate` (P2/P5)
- [x] 4.3 Add `unstable_cache` + `revalidatePath` per mutation in `src/lib/api/{services,settings}`; wire admin calendar refetch to mutation (P3/P4)
- [x] 4.4 Migrate API layer to `Result`/throw contract; dedupe mappers (C3); single-source services in `config.ts` (C5)

## Phase 5: Observability + tooling (E1–E5/S5)

- [x] 5.1 Create `src/app/error.tsx` + `src/app/global-error.tsx` (E1)
- [x] 5.2 Create `src/app/admin/loading.tsx` (E2)
- [x] 5.3 Remove debug `console.log`; fix `src/lib/email.ts` "disabled" hardcode (E3/E4); sanitize `dangerouslySetInnerHTML` (S5)
- [x] 5.4 Clear all ESLint warnings (`npx eslint`) (E4)
- [x] 5.5 Add `vitest.config.ts` + `@vitejs/plugin-react` + smoke test (E5)