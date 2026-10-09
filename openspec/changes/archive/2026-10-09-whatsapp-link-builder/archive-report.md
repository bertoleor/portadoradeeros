# Archive Report: whatsapp-link-builder

**Archived**: 2026-10-09 **Archived to**:
`openspec/changes/archive/2026-10-09-whatsapp-link-builder/` **Artifact store**: openspec
(repo-local) **Native status at close**: `nextRecommended: archive`, `blockedReasons: []`,
`applyState: all_done`

## Final State (at close)

- **Tasks**: 3/3 complete, 0 pending — per `tasks.md` (all checkboxes `[x]`, observed) and native
  `taskProgress` `{total: 3, completed: 3, allComplete: true}`. No unfinished tasks.
- **Verification**: the canonical `verify-report.md` artifact is missing (native status:
  `verifyReport: missing`; `applyProgress: missing`). However, a non-standard-named verification
  artifact `verify.md` EXISTS in this archive and records real command outputs dated 2026-09-15:
  - Strict TDD RED: `pnpm vitest run src/lib/whatsapp.test.ts` →
    `FAIL — Cannot find module '@/lib/whatsapp'`
  - Strict TDD GREEN: same command → `1 passed, 5 passed (5)`
  - Full suite: `pnpm test` → `Test Files 6 passed (6)`, `Tests 41 passed (41)`
  - Types: `pnpm typecheck` (`tsc --noEmit`) → exit 0, no errors These are recorded claims in that
    artifact at its write time, attributed here as such; they are not a canonical `sdd-verify` phase
    output. `state.yaml` (optional recovery hint, lowest authority) corroborates:
    `status: verified`, all phases `done`.
- **Missing artifacts**: `apply-progress`, canonical `verify-report.md`. Neither blocks archive
  (verification is an optional diagnostic); both are recorded as absent. `verify.md` is preserved in
  the archive as the de-facto verification record.
- **Config contradiction noted** (from `verify.md`, reported not fixed): `openspec/config.yaml` says
  `strict_tdd: false` + `npm run test`, while root `openspec.config.yaml` says `strict_tdd: true` +
  `pnpm test`. This change ran under Strict TDD with `pnpm`. Unifying configs was recommended as a
  follow-up; not done in this change.

## Specs Synced

| Domain   | Action  | Details                                                                                                                                                                                                                                                                              |
| -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| whatsapp | Created | Main spec `openspec/specs/whatsapp/spec.md` did not exist; delta spec was a full spec under `## ADDED Requirements` (1 requirement: Build validated WhatsApp deep link, 5 scenarios), copied mechanically. 0 requirements modified or removed — no existing main spec to merge into. |

Mechanical copy evidence (mktemp + `cp` + `diff -r` + `mv`, per skill Step 2 "Main Spec Does NOT
Exist" path):

```
$ diff -r "openspec/changes/whatsapp-link-builder/specs/whatsapp/spec.md" "<temp copy>"
(empty output — exit 0)
```

## Archive Contents (observed)

- `proposal.md`: present
- `specs/whatsapp/spec.md`: present (delta spec, preserved)
- `design.md`: present
- `tasks.md`: present — 3/3 tasks complete
- `state.yaml`: present (optional recovery hint; says `status: verified`)
- `verify.md`: present (non-standard verification record, see Final State)
- `verify-report.md`: missing (canonical artifact, recorded above)
- `apply-progress`: missing (recorded above)

## Move Evidence

Move executed as one shell transaction: pre-move recursive snapshot via `cp -R` to a scratch
`mktemp -d` root, then
`git mv openspec/changes/whatsapp-link-builder openspec/changes/archive/2026-10-09-whatsapp-link-builder`
(source tracked → `git mv` path taken; all six files staged as renames `R` in git index), then
mandatory `diff -r` readback:

```
$ diff -r "<snapshot_root>/source" "openspec/changes/archive/2026-10-09-whatsapp-link-builder"
(empty output — exit 0)
```

Empty `diff -r` output is the passing evidence: the archived tree is byte-identical to the pre-move
snapshot. The scratch snapshot dir was intentionally left in place (`rm` is denied by user config on
this host); it lives under the Hermes-managed scratch/tmp area and auto-prunes after 24h idle.

## Source of Truth Updated

- `openspec/specs/whatsapp/spec.md` — new main spec; contract is now:
  `buildWhatsAppLink(phone, message?)` pure function, 8–15 digit validation, separator stripping,
  `?text=` only for non-blank messages, throws `Error('Invalid WhatsApp phone number')` on invalid
  input.

## Notes

- Destructive-delta warning rule (`rules.archive: Warn before merging destructive deltas`) did not
  trigger: no existing main spec was modified or removed; a new spec file was created.
- This report is additive and was written after the move; it is excluded from the source/destination
  `diff -r` comparison per the skill.
