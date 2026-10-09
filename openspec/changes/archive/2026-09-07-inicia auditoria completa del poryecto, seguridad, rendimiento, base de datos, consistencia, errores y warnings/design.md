# Design: Auditoría completa — remediación integral

## Technical Approach

Severity-ordered remediation over five dimensions. Security lands FIRST (S3→S1→S2/S6) because it
closes live exposures; DB consolidation (D1/D2) unblocks the admin UI and gives typed code a
truthful schema; performance (P1–P5) and consistency (C1–C5) follow; observability (E1–E5) last.
Single source of truth: Supabase migrations (schema) + generated TS types (code) + one `is_admin()`
predicate (authorization) + throw-based error contract (failure mode).

## Architecture Decisions

### D-SEC-1: Admin allowlist location

| Option                                                     | Tradeoff                                                                       | Decision   |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------- |
| `auth.role()='authenticated'` (current)                    | Any signup = full admin (S3 bug)                                               | Reject     |
| user metadata flag                                         | User can self-edit `raw_user_meta_data` via `updateUser` → self-elevation risk | Reject     |
| env var email                                              | Not queryable inside Postgres RLS directly                                     | Reject     |
| **`admin_users` table + `is_admin()` SECURITY DEFINER fn** | Needs one bootstrap row; single predicate shared by RLS + server guard         | **Chosen** |

Rationale: RLS policies and the `requireAdmin()` server guard call the same Postgres function
`is_admin()`, so authorization is DB-enforced and cannot drift. Adding/removing admin = row edit, no
code deploy.

### D-SEC-2: Service-role key (S4)

Public booking (`createAppointment`) must broadcast push to ALL admin devices; `push_subscriptions`
RLS is `auth.uid()=admin_id`, which anon fails → this is the ONE legitimate bypass need. **Keep** a
rotated, scoped service-role key used only by `src/lib/supabase/admin.ts` (reads
`push_subscriptions` only). Remove `RESEND_API_KEY` (unused) and `supabaseAdmin` in dead
`supabase.ts`. Document scope in `.env.example`.

### D-SEC-3: Defense-in-depth guard (S2)

`requireAdmin()` server helper: `is_admin()` RPC → throw `AuthError` if false. Wrapped around every
mutating action (`confirmAppointment`, `completeAppointment`, `cancelAppointment`,
`createAppointmentAdmin`, `updateClient`, `create/update/deleteService`,
`create/update/deleteBlockedTime`). RLS is the backstop; this is the fail-fast front door.

### D-SEC-4: Booking status validation (S6)

`createAppointment` hardcodes `status:'pending'`. Public `/api/appointments` POST gains zod schema
(S7) enforcing `status ∈ {pending}` and required fields; arbitrary `status` rejected.

### D-PERF-1: Slot computation (P1/P2/P5)

Replace `findClient` full-scan (normalize-in-JS) with indexed `.eq(email)` / `.eq(phone)` + unique
constraint + `.maybeSingle()`. Replace per-day 30-day loops + JS filtering (`getNextAvailableSlots`,
`getBookedSlots`, `getOccupiedWindowsForDate`) with range SQL (`gte`/`lte` on indexed
`appointment_date`) and overlap computed in SQL, not JS.

### D-PERF-2: Caching (P3)

Server components reading Supabase: `unstable_cache` with per-mutation `revalidatePath('/...')`
(services/settings/admin). Chooser: `revalidatePath` after mutation beats time-based `revalidate=N`
(no stale reads); `dynamic` rejected (kills caching). Admin calendar refetch (P4) wired to
realtime/mutation, not global reload.

### D-DB-1: Schema consolidation (D1/D2/D4)

Replace 8 overlapping `migrations/*.sql` with ordered Supabase migrations as single source.
Regenerate TS types via `supabase gen types typescript` → `src/types/database.ts`. Add `UNIQUE` on
`clients.email` (D4), index `appointments.appointment_date` (D3).

> Correction: admin UI reads `contact_messages` (mensajes) and `admin_settings` (config) — NOT
> literally `messages`/`settings`. Consolidate to these real names; CREATE IF NOT EXISTS where live
> drift removed them.

### D-CONS: Error contract (C4)

Unified `Result<T>` return (`{ ok, data? , error? }`) OR throw `AppError` + error boundary.
`checkSlotAvailability` MUST fail **closed** (`available:false` on query error).

### D-ERR-5: Test runner (E5)

**Vitest** + `@vitejs/plugin-react`. Justify: TS/TSX out-of-box, no babel/ts-jest config, fast,
matches Vite-native Next toolchain. Coverage: pure logic (slot math, error contract, zod schemas) —
no DOM.

## Data Flow

```
Public booking form → POST /api/appointments (zod) → createAppointment
   → clients upsert (indexed) → appointments INSERT (status=locked 'pending', RLS WITH CHECK)
   → sendPushToAdmins [admin.ts service-role] ──→ all push_subscriptions
Admin action → requireAdmin() (is_admin() RPC) ──→ RLS (is_admin()) ──→ table
```

## File Changes

| File                                                            | Action | Description                            |
| --------------------------------------------------------------- | ------ | -------------------------------------- |
| `src/lib/auth/requireAdmin.ts`                                  | Create | server guard (D-SEC-3)                 |
| `src/lib/supabase/admin.ts`                                     | Create | scoped service-role client (push only) |
| `src/lib/api/error.ts`                                          | Create | `AppError` + `Result<T>` contract      |
| `src/app/error.tsx`, `global-error.tsx`                         | Create | E1 boundaries                          |
| `src/app/admin/loading.tsx`                                     | Create | E2                                     |
| `migrations/<NN>_*.sql`                                         | Create | consolidated schema + RLS + policies   |
| `src/types/database.ts`                                         | Create | generated types                        |
| `vitest.config.ts`                                              | Create | E5                                     |
| `src/lib/api/{appointments,blocked-times,services,settings}.ts` | Modify | P1/P2/P5, C4, guards, mappers          |
| `src/app/admin/login/actions.ts`                                | Modify | allowlist check + disabled message     |
| `src/app/api/{appointments,contact}/route.ts`                   | Modify | zod (S7/S6)                            |
| `src/lib/email.ts`                                              | Modify | E4 remove "disabled" hardcode          |
| `src/lib/config.ts`                                             | Modify | C5 drop hardcoded SERVICES             |
| `.env.example`                                                  | Modify | secret hygiene (S4)                    |
| `src/lib/supabase.ts`, `src/hooks/useAuth.tsx`                  | Delete | dead module (C2), vestigial auth (C1)  |

## Interfaces / Contracts

```ts
export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };
export class AppError extends Error {
  constructor(
    public code: 'UNAUTHORIZED' | 'VALIDATION' | 'DB' | 'NOT_FOUND',
    msg: string
  ) {
    super(msg);
  }
}
export function getBookedSlots(dateStr: string): Promise<string[]> {
  /* set-based SQL */
}
```

## Testing Strategy

| Layer       | What                                                         | Approach               |
| ----------- | ------------------------------------------------------------ | ---------------------- |
| Unit        | slot math, error contract, zod schemas, findClient normalize | Vitest                 |
| Integration | RLS anon-denied (manual HTTP curl)                           | success criteria check |

## Migration / Rollout

1. **S3 first**: disable signup, create `admin_users` + seed existing admin UID, deploy `is_admin()`
   fn + rewrite policies to `is_admin()`.
2. **S1**: enable RLS on `clients`/`appointments`/`blocked_times` with per-table policies (admin
   full CRUD via `is_admin()`; anon: services SELECT `is_visible=true`, appointments INSERT
   `status='pending'` only, blocked_times SELECT public).
3. **D1**: create/consolidate tables + `appointment_date` index + email UNIQUE (backfill dedupe
   first).
4. Backward-compat: new columns nullable (`client_id`, `status` CHECK already exists),
   `CREATE ... IF NOT EXISTS`, migrations reversible (down). **Backup via `pg_dump` before S1/D1.**

## Open Questions

- [ ] Confirm existing admin user UID/email before seeding `admin_users` (S3 prerequisite).
- [ ] Live DB: does `contact_messages`/`admin_settings` actually exist, or is drift the 404 cause?
      (D1 blocks on this.)
- [ ] Is service-role rotation acceptable to keep the push broadcast, or adopt `pg_net`/Edge
      Function later?
