# Proposal: WhatsApp Link Builder

## Intent

`src/lib/socials.ts` builds WhatsApp URLs with an inline regex
(`username.replaceAll(/\D/g, '')`) and no validation: empty input yields
`https://wa.me/`, short/long digit strings pass silently. Add one minimal
pure function `buildWhatsAppLink(phone, message?)` with explicit
validation, covered by Strict TDD, so every WhatsApp CTA site-wide shares
one tested contract.

## Scope

### In Scope

- New pure module `src/lib/whatsapp.ts`: `buildWhatsAppLink` + phone validation
- Unit tests `src/lib/whatsapp.test.ts` (Strict TDD: RED before GREEN)
- SDD chain in `openspec/changes/whatsapp-link-builder/` + `verify.md`

### Out of Scope

- Refactoring `socials.ts` callers to use it (follow-up change)
- UI components, E2E, DB, API routes

## Approach

1. RED: write failing tests for valid/invalid/message cases.
2. GREEN: implement pure function, no dependencies.
3. Verify: targeted vitest + full `pnpm test` + `pnpm typecheck`.

## Risks

| Risk | Likelihood | Mitigation |
| ---- | ---------- | ---------- |
| Over-strict digit rule rejects real numbers | Low | Accept 8–15 digits (E.164 range sans `+`), strip separators first |
| Scope creep (normalization per country) | Low | No country logic; digits-only contract |

## Rollback Plan

Single bounded commit; `git revert` restores prior state (new files only,
no modifications to existing code).

## Success Criteria

- `pnpm test` green (incl. new `whatsapp.test.ts`), `pnpm typecheck` green
- `verify.md` records real command outputs
- Bounded commit, no push
