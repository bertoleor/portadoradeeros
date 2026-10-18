> Parte de: [[INDICE-SISTEMA]] · Relacionados: [[ADR-TEMPLATE]], [[PRD-TEMPLATE]]

# ODD Feature — EROS Email Input Hardening (H3)

> **Búsqueda:** keywords:
> `eros, hardening, zod, validation, booking, email, subject-injection, logger, trash` ·
> clasificación: `odd-feature` · estado: closed · actualizado: 2026-10-16 (T2 client caps + closure)

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
- [x] T2: zod server-side validation for the booking server action payload (exported
      `appointmentSchema` applied before honeypot/rate-limit/availability in `createAppointment`), +
      client `maxLength` on ServiceContactForm inputs.
  - evidence: server side — `src/lib/api/appointments.ts:212` applies
    `appointmentSchema.safeParse(payload)` before any side effect (rate-limit counter, availability
    query, DB write, emails); schema lives in `src/lib/api/appointments-schemas.ts` (no
    `'use server'`, relocated by e4ac924 after E2E booking broke). Client side (2026-10-16, this
    closure run) — `maxLength` on BOTH public forms: `ServiceContactForm.tsx` field entries (name
    300, surname 300, email 320, phone 50) + notes textarea 5000, and `contacto/page.tsx` (name 200,
    email 320, phone 50, message 5000), mirroring `appointmentSchema`/`contactSchema` caps
    (name+surname concatenation stays server-bounded at 300). Guard:
    `src/__tests__/input-bounding-guards.test.ts` — RED 10 failed (2026-10-16 09:57) → GREEN 10/10
    (10:04).

- [x] T3: migrate 5 `console.error` sites in resend.ts (3) + smtp.ts (2) to `logger.error` with
      structured context.
  - evidence: `grep -c console.error src/lib/email/resend.ts src/lib/email/smtp.ts` → 0 / 0;
    `logger.warn/error` sites: resend.ts 3, smtp.ts 2 (commit 75c964e, re-verified 2026-10-16).

- [x] T4: trash `src/lib/email-templates/turno-confirmado.html` (0 importers) + fix stale cite in
      `docs/07-repos-relacionados.md:14`.
  - evidence: `src/lib/email-templates/` is empty; `E:/Hermes/trash/.trash-log.jsonl` records the
    file (2026-10-08 and re-apply 2026-10-09, `trash/20261009/turno-confirmado.html`, 6536 bytes);
    `grep -rn turno-confirmado docs/07*` → 0 hits. Remaining mentions live only in historical audit
    records (AUDITORIA_COMPLETA_2026.md, F4-2026-10-01.md §H3) describing the finding at their time.

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
- 2026-10-16 (closure run, 24-orquestador turno noche): guard suite new file
  `src/__tests__/input-bounding-guards.test.ts` executed RED first → **10 failed (10)** at 09:57
  (missing maxLength on both public forms), then GREEN after the caps: **10 passed (10)** at 10:04.
  Full suite `npx vitest run --no-cache` → **Test Files 18 passed (18), Tests 166 passed (166)**
  (vitest 4.1.11, node 26.7.0). Typecheck `npx tsc --noEmit` → exit 0 (log: npm config warnings
  only, zero TS errors). T3/T4 re-verified against working tree at HEAD a01b970.

## Accepted changes and rationale

- T1 ownership ambiguity (commit 5fcd14c authored during run-28 crash window, identity = machine git
  config) resolved by verification, not re-work: the implementation matches the spec exactly and
  14/14 tests pass; re-doing it would only churn the shared branch. Documented in kanban comment #9.

## Open questions

- none blocking; T2-T4 proceed under this doc.

## Log

- 2026-10-16 (24-orquestador): closure of this feature doc — the contract requires running the
  closure of ODD docs with open tasks without evidence. T2's client half (maxLength on the two
  public forms) was the only code gap; implemented TDD-first with a static guard suite mirroring the
  zod caps, then the doc was closed with per-task evidence. Work committed on branch
  `feat/eros-email-hardening` (the lane's live branch; the Constraints section named
  `feat/eros-deps`, which is an ancestor and no longer exists on origin after PR #13). Note for the
  lane: `feat/eros-email-hardening` is NOT in `ci.yml` push triggers (`main`, `develop`,
  `feat/eros-deps`) — CI coverage for this branch only happens via `pull_request` against
  `main`/`develop`.
