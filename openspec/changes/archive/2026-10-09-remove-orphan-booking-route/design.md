# Design: Remove Orphan Booking Route

## Technical Approach

Deletion-only change. Confirm zero callers of `POST /api/appointments`, delete
`src/app/api/appointments/route.ts` + `route.test.ts`, keep the canonical `createAppointment()`
server action untouched. Maps 1:1 to the proposal approach; no new runtime code.

## Architecture Decisions

| Option                              | Tradeoff                           | Decision                                                                  |
| ----------------------------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| Delete route + tests in one commit  | Minimal diff, easy revert          | **Chosen** — matches proposal scope                                       |
| Deprecate with 410 Gone shim        | Preserves unknown external callers | Rejected — no DB writes in route, no internal callers, revert covers risk |
| Migrate route to call server action | Keeps HTTP surface alive           | Rejected — spec mandates server-action-only path                          |

## Data Flow

```
ServiceContactForm ──→ createAppointment() ──→ Supabase (appointments)
       (x) POST /api/appointments — deleted, no DB writes
```

Contact flow unchanged: `contacto/page.tsx ──→ POST /api/contact`.

## File Changes

| File                                     | Action    | Description                            |
| ---------------------------------------- | --------- | -------------------------------------- |
| `src/app/api/appointments/route.ts`      | Delete    | Orphan email-only POST, no persistence |
| `src/app/api/appointments/route.test.ts` | Delete    | Tests of removed behavior              |
| `src/lib/api/appointments.ts`            | Untouched | Canonical `createAppointment()` action |
| `src/app/api/contact/route.ts`           | Untouched | Live route, out of scope               |

## Interfaces / Contracts

None added or modified. Post-change contract: booking creation exists only via
`createAppointment()`; `POST /api/appointments` returns 404 (route absent); `POST /api/contact`
unchanged.

## Testing Strategy

| Layer | What to Test                           | Approach                                      |
| ----- | -------------------------------------- | --------------------------------------------- |
| Unit  | No `api/appointments` importers remain | `grep -r "api/appointments" src/` → zero hits |
| Suite | No regressions                         | `pnpm test` green                             |
| Types | No dangling imports                    | `pnpm typecheck` green                        |

## Threat Matrix

N/A — no routing additions, shell, subprocess, VCS/PR automation, executable-file classification, or
process-integration boundary. Change only removes an HTTP surface.

## Migration / Rollout

No migration required. Rollback: `git revert` of the single deletion commit restores route + tests.

## Open Questions

None.
