# Archive Report: remove-orphan-booking-route

**Archived**: 2026-10-09 **Archived to**:
`openspec/changes/archive/2026-10-09-remove-orphan-booking-route/` **Artifact store**: openspec
(repo-local) **Native status at close**: `nextRecommended: archive`, `blockedReasons: []`,
`applyState: all_done`

## Final State (at close)

- **Tasks**: 4/4 complete, 0 pending — per `tasks.md` (all checkboxes `[x]`, observed) and native
  `taskProgress` `{total: 4, completed: 4, allComplete: true}`. No unfinished tasks.
- **Verification**: NOT run as a dedicated `sdd-verify` phase. The canonical `verify-report.md`
  artifact is missing (native status: `verifyReport: missing`; `applyProgress: missing`). Apply-time
  evidence only: task 3.1 in `tasks.md` records that `pnpm test` (vitest) and `pnpm typecheck` were
  run green at apply time, and task 3.2 records the status-doc/Linear update and commit on
  `feat/rls-phase10`. These are claims recorded in the tasks artifact at apply time, not an
  independent verification report.
- **Missing artifacts**: `apply-progress`, `verify-report`. Neither blocks archive (verification is
  an optional diagnostic); both are recorded as absent.

## Specs Synced

| Domain                 | Action  | Details                                                                                                                                                                                                                                                                 |
| ---------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| booking-canonical-path | Created | Main spec `openspec/specs/booking-canonical-path/spec.md` did not exist; delta spec was a full spec (2 requirements: Single Booking Path, Contact Route Untouched), copied mechanically. 0 requirements were modified or removed — no existing main spec to merge into. |

Mechanical copy evidence (mktemp + `cp` + `diff -r` + `mv`, per skill Step 2 "Main Spec Does NOT
Exist" path):

```
$ diff -r "openspec/changes/remove-orphan-booking-route/specs/booking-canonical-path/spec.md" "<temp copy>"
(empty output — exit 0)
```

## Archive Contents (observed)

- `proposal.md`: present
- `specs/booking-canonical-path/spec.md`: present (delta spec, preserved)
- `design.md`: present
- `tasks.md`: present — 4/4 tasks complete
- `state.yaml`: not present for this change
- `verify-report.md`: missing (recorded above)
- `apply-progress`: missing (recorded above)

## Move Evidence

Move executed as one shell transaction: pre-move recursive snapshot via `cp -R` to a scratch
`mktemp -d` root, then
`git mv openspec/changes/remove-orphan-booking-route openspec/changes/archive/2026-10-09-remove-orphan-booking-route`
(source tracked → `git mv` path taken; all four files staged as renames `R` in git index), then
mandatory `diff -r` readback:

```
$ diff -r "<snapshot_root>/source" "openspec/changes/archive/2026-10-09-remove-orphan-booking-route"
(empty output — exit 0)
```

Empty `diff -r` output is the passing evidence: the archived tree is byte-identical to the pre-move
snapshot. The scratch snapshot dir was intentionally left in place (`rm` is denied by user config on
this host); it lives under the Hermes-managed scratch/tmp area and auto-prunes after 24h idle.

## Source of Truth Updated

- `openspec/specs/booking-canonical-path/spec.md` — new main spec; booking creation contract is now:
  only `createAppointment()` server action, no `POST /api/appointments` route, `POST /api/contact`
  untouched.

## Notes

- Destructive-delta warning rule (`rules.archive: Warn before merging destructive deltas`) did not
  trigger: no existing main spec was modified or removed; a new spec file was created.
- This report is additive and was written after the move; it is excluded from the source/destination
  `diff -r` comparison per the skill.
