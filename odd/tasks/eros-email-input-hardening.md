> Parte de: [[INDICE-SISTEMA]] · Relacionados: [[ADR-TEMPLATE]], [[PRD-TEMPLATE]]

# ODD Feature — EROS Email Input Hardening (H3)

> **Búsqueda:** keywords:
> `eros, hardening, zod, validation, booking, email, subject-injection, logger, trash` ·
> clasificación: `odd-feature` · estado: in-progress · actualizado: 2026-10-09 (T2-T4 re-aplicados)

## Objective

Bound and normalize every public-form input that flows into email subjects/bodies (contact +
booking), migrate email modules to the structured logger, and retire dead EmailJS residue.

## Problem / Why

F4-refresh 2026-10-07 (docs/F4-2026-10-01.md §4-H3) found the public contact form and the booking
server action accept unbounded, untrimmed payloads whose values land in email subjects
(`Contacto web: ${name}`, `Nuevo turno solicitado: ...`). Nodemailer/Resend neutralize CRLF header
injection internally (verified empirically by 34-auditor), so this is perimeter hardening, not an
exploitable vuln (P3).

## Scope

- In: contactSchema caps+trim; zod schema for `createAppointment` payload (server action);
  `console.error` → `logger` in resend.ts/smtp.ts; trash `turno-confirmado.html` (0 importers) + fix
  stale doc cite; client-side `maxLength` on the two public forms.
- Out: admin-side appointment creation validation (auth-gated surface, different risk); changing
  email subjects/templates; rate limiting (already shipped).

## Constraints

- TDD strict (RED→GREEN→REFACTOR), vitest, `npm run test`/`typecheck`.
- zod v4 (`z.email()` format API — no `z.string().email()`).
- No file deletions: use `scripts/trash.py --agent 32 --reason ...`.
- Ticket: `t_e7838be7`, branch `feat/eros-deps` (shared branch — commit only my files).

## Tasks (stable IDs)

- [x] T1: contactSchema payload caps + server-side trim — **done by prior run 28 / commit
      `5fcd14c`** (author identity is the machine's git config), verified this run:
      `npx vitest run --no-cache src/app/api/contact/route.test.ts` → 14/14 pass.
  - evidence: commit 5fcd14c; test output "Tests 14 passed (14)" 2026-10-08 18:35
- [ ] T2: zod server-side validation for the booking server action payload (exported
      `appointmentSchema` applied before honeypot/rate-limit/availability in `createAppointment`), +
      client `maxLength` on ServiceContactForm inputs.
  - evidence: pending (server-side schema re-applied 2026-10-09; client maxLength pending)

- [ ] T3: migrate 5 `console.error` sites in resend.ts (3) + smtp.ts (2) to `logger.error` with
      structured context.
  - evidence: pending (re-applied 2026-10-09 from rescue commit d758d86)
- [ ] T4: trash `src/lib/email-templates/turno-confirmado.html` (0 importers) + fix stale cite in
      `docs/07-repos-relacionados.md:14`.
  - evidence: pending (trashed 2026-10-09 via trash.py, doc cite fixed)

## Accumulated evidence

- 2026-10-08: `npx vitest run --no-cache src/app/api/contact/route.test.ts` → Test Files 1 passed
  (1), Tests 14 passed (14). T1 verified.
- 2026-10-08: zod v4 probes (node -e): `z.string().trim().min(1).max(n)` order works on trimmed
  value; `z.email().max(320)` rejects long domains but allows long local parts ≥320 (still accepted
  — documented residual, harmless: contact route also caps total request via trim+max on other
  fields; email local-part length is bounded by max(320) only when the WHOLE address >320 —
  long-local remains a theoretical edge, rejected only if >320 total. Accepted.)
- 2026-10-08: `git status` clean except `.codegraph/` untracked; HEAD = 5fcd14c. No parallel worker
  alive on this task (only own PID 83700).

## Accepted changes and rationale

- T1 ownership ambiguity (commit 5fcd14c authored during run-28 crash window, identity = machine git
  config) resolved by verification, not re-work: the implementation matches the spec exactly and
  14/14 tests pass; re-doing it would only churn the shared branch. Documented in kanban comment #9.

## Open questions

- none blocking; T2-T4 proceed under this doc.
