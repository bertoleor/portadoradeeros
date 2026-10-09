# Archive Report: inicia auditoria completa del poryecto, seguridad, rendimiento, base de datos, consistencia, errores y warnings

**Status**: ARCHIVED (intentional, full — no warnings required) **Archive date**: 2026-09-07
**Verification**: PASS — `npx tsc --noEmit` exit 0 (0 errors), `npm run lint` exit 0 (0 warnings),
`npm test` 3/3 pass. 0 CRITICAL, 0 WARNING. **Mode**: hybrid/both (openspec filesystem + Engram
archive report)

## Artifact Observation IDs (Engram traceability)

- proposal: #887
- spec (6 capabilities): #890
- design: #891
- tasks: #894
- apply-progress (5 slices + warning remediation): #901
- verify-report (re-run, PASS): #972
- exploration: #878
- DB audit discovery: #879

## Deliverable — full remediation delivered

Complete audit + remediation of the Portadora de Eros codebase (Next.js 16 / React 19 / TS strict /
Supabase / Vitest) across security, performance, database, consistency, and errors/warnings.
Implemented in 5 stacked PR slices (force-chained, stacked-to-main) + 1 warning-remediation pass. No
commits/PRs opened (per instruction).

**Security**: signup closed (`disable_signup=true`); `admin_users` allowlist seeded (UID
`6b4942b1-...`); `is_admin()` SECURITY DEFINER; RLS enabled on
`clients`/`appointments`/`blocked_times`/`contact_messages`/`admin_settings` (anon SELECT denied on
PII; anon writes denied on blocked_times; status constrained to `pending`); `requireAdmin()` guard
on all 8+ mutators; zod validation on public `/api/appointments` + `/api/contact`; status forced to
`pending` server-side; deprecated `src/lib/supabase.ts` + `src/hooks/useAuth.tsx` removed.

**Performance**: `findClient` → indexed `.eq(email/phone).maybeSingle()`; 30-day loops replaced with
indexed range SQL; RSC caching (`unstable_cache`) + `revalidateTag`/`revalidatePath` per mutation.

**Database**: consolidated 7 overlapping migrations into single-source canonical schema;
`contact_messages`/`admin_settings` exist live (8 tables); index on `appointments.appointment_date`;
UNIQUE on `clients.email`; regenerated `src/types/database.ts`.

**Consistency**: unified `AppError`/`Result<T>` error contract across API/server mutators (warning
W3 resolved); single-source services in config.

**Observability**: `error.tsx` + `global-error.tsx`; `admin/loading.tsx`; debug `console.log`
removed; ESLint clean; Vitest 3.2.7 + smoke test (3/3 pass); sanitize-html for `bioContent`.

## Specs synced to canonical source of truth (`openspec/specs/`)

All 6 delta specs were FULL specs (main tree previously empty, only `.gitkeep`). Copied directly:

- `openspec/specs/auth-hardening/spec.md` (Created)
- `openspec/specs/row-level-security/spec.md` (Created)
- `openspec/specs/booking-validation/spec.md` (Created)
- `openspec/specs/data-access-layer/spec.md` (Created)
- `openspec/specs/schema-consolidation/spec.md` (Created)
- `openspec/specs/observability/spec.md` (Created)

No destructive merges — no pre-existing main specs were modified.

## config.yaml

No changes required. `rules.archive` ("Warn before merging destructive deltas") satisfied — no
destructive merge occurred. `schema: spec-driven` retained.

## Task completion gate

PASSED. tasks.md shows 21/21 `[x]`, no stale unchecked implementation tasks. No archive-time
reconciliation needed.

## Non-blocking follow-ups (tracked, SUGGESTION level — intentionally NOT fixed)

1. `uploadImage` (`src/lib/api/storage.ts`) still returns `{success:false, error}` mix instead of
   `Result<T>` contract (W2 guard added; contract carryover remains).
2. Public `/servicios` page uses anon browser client (`createClient()`) instead of cached
   `getVisibleServices()` — bypasses `public-services` cache, duplicates fetch path. RLS still
   filters (no security issue).
3. `findClient` phone match is exact-match without normalization — consider normalized phone
   column/index.
4. `src/lib/config.ts` is now effectively empty (only a comment; constants removed) — harmless dead
   file.
5. Nullable-column drift between generated types and some columns (verify-report noted) — verify
   before any schema change. All non-blocking; no CRITICAL or WARNING at archive time.

## Follow-ups resolved (2026-09-07, post-archive `sdd-apply`)

All 5 SUGGESTION-level follow-ups from the archived audit were resolved in a code-only pass (no
commits/PRs). Verified: `npx tsc --noEmit` exit 0, `npm run lint` exit 0 (0 warnings), `npm test`
3/3 pass.

1. **`uploadImage` Result contract** — `src/lib/api/storage.ts` now returns
   `Promise<Result<{ url: string }>>` via `ok`/`fail` + `AppError` (`VALIDATION` for missing file,
   `DB` for storage failure). `requireAdmin()` guard retained (throws `UNAUTHORIZED`). Caller
   `src/components/ui/ImageUploader.tsx` updated to
   `result.ok`/`result.data.url`/`result.error.message`.
2. **Public `/servicios` cached fetch** — `src/app/servicios/page.tsx` now uses the cached
   `getVisibleServices()` server action (`unstable_cache` + `revalidateTag`) instead of an on-mount
   anon browser-client query. Anon client import removed; RLS (`is_visible = true`) and the cache
   preserved.
3. **Phone normalization** — added `normalizePhone()` (strips non-digit/non-`+`) in
   `src/lib/api/appointments.ts`; applied consistently to the `findClient` phone lookup, and to
   store/write paths (`findOrCreateClient` create + update, `updateClient`), so dedupe by phone is
   robust against formatting.
4. **Dead `config.ts`** — confirmed zero imports and deleted `src/lib/config.ts`.
5. **Nullable-column drift** — resolved in the type/safety layer (no DDL).
   `Client.created_at`/`updated_at` now `string | null`; `getClients` coalesces `status` to
   `'pending'`; `BlockedTime.is_all_day` now `boolean | null` with `?? false`/`=== true` in
   consumers; `ContactMessage.status` typed `string | null`; the one real runtime-crash site
   (`[id]/page.tsx` `new Date(client.created_at)`) null-guarded. `services.is_visible`/`icon` were
   already defaulted in `mapServiceRow` (no change needed). No `as any` introduced.

## Verdict

**ARCHIVED — SDD cycle complete.** All planned, implemented, verified (PASS), and archived. Ready
for next change.
