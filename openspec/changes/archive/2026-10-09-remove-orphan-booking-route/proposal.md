# Proposal: Remove Orphan Booking Route

## Intent

ORN-75 (VERIFIED): two booking paths exist — email-only `POST /api/appointments` (131 lines, no DB
persistence) vs canonical server action `createAppointment()` used by `ServiceContactForm`. One
canonical path; delete the orphan route.

## Scope

### In Scope

- Delete `src/app/api/appointments/route.ts` (no internal callers, no DB writes)
- Delete its `route.test.ts` (tests deleted behavior)
- Verify suite + typecheck green, no remaining importers

### Out of Scope

- Changes to the canonical server action or the form
- `/api/contact` (live, called by `contacto/page.tsx`)

## Capabilities

### New Capabilities

- `booking-canonical-path`: single booking-path contract (server action only)

### Modified Capabilities

- None (no existing specs cover this route)

## Approach

Confirm zero callers via grep, delete both files, run `pnpm test` + `typecheck`. Public-route
removal is revertible with one revert commit.

## Affected Areas

| Area                                     | Impact  | Description            |
| ---------------------------------------- | ------- | ---------------------- |
| `src/app/api/appointments/route.ts`      | Removed | Orphan email-only POST |
| `src/app/api/appointments/route.test.ts` | Removed | Tests of removed route |

## Risks

| Risk                          | Likelihood | Mitigation                                        |
| ----------------------------- | ---------- | ------------------------------------------------- |
| Unknown external POST callers | Low        | No internal callers; revert commit restores route |
| Admin flows use the route     | Low        | Admin uses `lib/api/appointments` server actions  |

## Rollback Plan

`git revert` of the single commit restores route + tests.

## Dependencies

- None

## Success Criteria

- [ ] `POST /api/appointments` no longer exists; form books via server action only
- [ ] `pnpm test` and `pnpm typecheck` green
- [ ] ORN-75 closed with evidence
