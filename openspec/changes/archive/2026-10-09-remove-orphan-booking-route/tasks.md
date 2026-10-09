# Tasks: Remove Orphan Booking Route

## Review Workload Forecast

| Field                   | Value          |
| ----------------------- | -------------- |
| Estimated changed lines | ~200 deletions |
| 400-line budget risk    | Low            |
| Chained PRs recommended | No             |
| Suggested split         | single PR      |
| Delivery strategy       | single-pr      |
| Chain strategy          | pending        |

Decision needed before apply: No Chained PRs recommended: No Chain strategy: pending 400-line budget
risk: Low

## Phase 1: RED — Prove Orphan Status

- [x] 1.1 Grep `src/` for `api/appointments` fetchers/importers; record zero live callers (contact
      page uses `/api/contact` only)

## Phase 2: GREEN — Removal

- [x] 2.1 Delete `src/app/api/appointments/route.ts` and `src/app/api/appointments/route.test.ts`

## Phase 3: Verify

- [x] 3.1 Run `pnpm test` (vitest) + `pnpm typecheck` → green; confirm form still imports
      `createAppointment`
- [x] 3.2 Update `docs/STATUS.md` note + Linear ORN-75 to Done; commit + push (`feat/rls-phase10`)
