# Tasks: WhatsApp Link Builder

## Review Workload Forecast

| Field                   | Value                           |
| ----------------------- | ------------------------------- |
| Estimated changed lines | ~120 additions (new files only) |
| 400-line budget risk    | Low                             |
| Chained PRs recommended | No                              |
| Suggested split         | single commit                   |
| Delivery strategy       | single-pr                       |

Decision needed before apply: No

## Phase 1: RED — Failing tests first (Strict TDD)

- [x] 1.1 Write `src/lib/whatsapp.test.ts` covering the 5 spec scenarios; run
      `pnpm vitest run src/lib/whatsapp.test.ts` → MUST FAIL (no module yet)

## Phase 2: GREEN — Minimal implementation

- [x] 2.1 Create `src/lib/whatsapp.ts` (`buildWhatsAppLink`); re-run targeted test → MUST PASS; run
      full `pnpm test` + `pnpm typecheck` → green

## Phase 3: Close

- [x] 3.1 Write `openspec/changes/whatsapp-link-builder/verify.md` with real outputs; tick all
      tasks; bounded `git commit` of new files only, no push
