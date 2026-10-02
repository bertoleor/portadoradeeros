# ODD Feature — eros-d1-booking-timezone-canonical

> **Búsqueda:** keywords:
> `timezone, ART, wall-clock, getBookedSlots, CustomTimePicker, booking, timezone-canonical, EROS-D1`
> · clasificación: `odd-feature` · estado: in-progress · actualizado: 2026-10-01

## Objective

One canonical timezone for the whole public booking flow: every "HH:mm" / "YYYY-MM-DD" value
exchanged between server and client is wall-clock business time (America/Argentina/Buenos_Aires,
fixed UTC-3), while absolute instants (epoch/ISO) remain the only thing compared or persisted.

## Problem / Why

Audit finding EROS-D1 (P2, 34-auditor 2026-09-30): `getBookedSlots` built its "HH:mm" strings with
`getUTCHours()/getUTCMinutes()` and queried a UTC day window (`T00:00:00Z`..`T23:59:59Z`), while
`CustomTimePicker` compares those strings against wall-clock ART hours and `ServiceContactForm`
submits `new Date(y, m-1, d, hh, mm)` in server-local time. In Argentina (UTC-3) every "Reservado"
mark was shifted 3 hours: a real 15:00 appointment showed as booked at 18:00 and 15:00 looked free.
The server-side anti-overbooking guard compares absolutes and still rejects, so this is wrong
availability UX, not double-booking. Same defect class in `getNextAvailableSlots` (auditor note,
appointments.ts:913).

## Scope

- In: `src/lib/timezone.ts` (canonical helpers, Intl-only, zero new deps) + unit tests;
  `getBookedSlots` (ART day window + ART labels); `getNextAvailableSlots` (ART business-day walk +
  ART labels, no productive callers today but must not carry the drift);
  `ServiceContactForm.handleSubmit` (ART instant construction); ADR-0002 documenting the canonical;
  this ODD doc.
- Out: `checkSlotAvailability` (compares absolutes, verified OK by auditor — its local-day window is
  a separate concern); E2E Supabase stubbing (separate ticket); DST handling beyond correctness via
  Intl (Argentina has no DST since 2009).

## Constraints

- TDD strict (RED→GREEN→REFACTOR), runner vitest, `environment: 'node'` (no jsdom yet — pure logic
  tests).
- Tests assert absolute UTC instants (TZ-of-process invariant), never runner-local times.
- No new dependencies (Intl only). TS strict. Conventional Commits, no Co-Authored-By.
- Branch: `feat/eros-deps`. Auto-pilot commit rules (dev-protocol): gates green → commit + push to
  working branch.

## Tasks (stable IDs)

- [x] T1: RED — `src/lib/timezone.test.ts` pinning the canonical helpers contract (ART wall-clock ↔
      epoch, ART day bounds, process-TZ invariance). RED confirmed 2026-10-02
      (`Cannot find module './timezone'`).
- [x] T2: GREEN — `src/lib/timezone.ts`: `BUSINESS_TIME_ZONE`, `zonedWallClockMs`,
      `formatWallClockHHmm`, `artDayBounds`, `zonedDateStr`, `zonedTodayDateStr`. 11/11 green,
      re-verified TZ=UTC and TZ=ART (process-TZ invariance).
- [x] T3: RED — `src/lib/booking-slots.test.ts`: 15:00 ART appointment blocks exactly "15:00" (not
      "18:00"); ART day window captures a 22:00 ART booking whose UTC instant is next UTC date;
      merge/dedupe; duration fallback. 13 tests.
- [x] T4: GREEN — `getBookedSlots` uses `artDayBounds` (ART day window) +
      `slotsOccupiedByAppointment`/`mergeOccupiedLabels` (ART labels) via new pure module
      `src/lib/booking-slots.ts`.
- [x] T5: RED→GREEN — `getNextAvailableSlots` aligned: ART window bounds, ART-day `blocked_times`
      occupancy (no more server-local
      `new Date(\`T00:00:00\`)`), ART business-day walk via `nextAvailableArtSlots`, ART labels.
      Fake-clock tests in booking-slots.test.ts.
- [x] T6: GREEN — `ServiceContactForm.handleSubmit` builds the instant via
      `zonedWallClockMs(date, time)` — browser TZ no longer matters.
- [x] T7: ADR-0002 + typecheck + full suite + work-unit commit.
  - evidence: docs/adr/0002-timezone-canonical.md · typecheck EXIT=0 (tsc --noEmit, 2026-10-02) ·
    vitest 16 files / 137 tests green (24 new of mine: 11 timezone + 13 booking-slots) · TZ=UTC run
    of the 24: 24/24 green · prettier --write applied to all touched files.

## Accumulated evidence

- 2026-10-01: drift confirmed on live code — `getBookedSlots` labels UTC (appointments.ts:350),
  picker compares wall-clock (CustomTimePicker.tsx:141-142), form submits local `new Date`
  (ServiceContactForm.tsx:587-596), `getNextAvailableSlots` labels UTC (appointments.ts:913).
  `getNextAvailableSlots` has no productive callers (grep verified).
- 2026-10-01: canonical precedent in repo — 4×
  `Intl.DateTimeFormat(..., { timeZone: 'America/Argentina/Buenos_Aires' })` in appointments.ts
  emails + reminders route.ts:72.
- 2026-10-02: suite full 16 files / 137 tests green post-rewrite (incl. a11y lane's 24).
  ESLint/prettier clean on touched files. Lane a11y (t_407514f7) had committed `0f4c2a0` touching
  ServiceContactForm/CustomTimePicker — my diff is the minimal handleSubmit + import, no conflicts.
- 2026-10-02: extracted pure `src/lib/booking-slots.ts` because appointments.ts is `'use server'`
  with next/cache+web-push import chains that hang under vitest node (probe timed out; probe file
  discarded, $TMPDIR self-prunes).

## Accepted changes and rationale

- Canonical = ART wall-clock for labels/exchange; absolutes for comparison/persistence. Rationale:
  the picker, business hours config and blocked times are all wall-clock by product design (business
  9-18 ART); ART is already the presentation standard in every email path.
- `checkSlotAvailability` intentionally untouched (absolute-time guard, out of scope).

## Next step

None — feature complete. Close loop via work-unit commit (this run) and move ODD doc to `completed`.

## Progress

- 2026-10-01: task taken (run 1042). Diagnosis verified, ODD doc created.
- 2026-10-01: T1 RED + T2 GREEN (`timezone.ts` + 11 tests green).
- 2026-10-02: T3–T6 already implemented on the tree from prior run (booking-slots.ts extraction,
  appointments.ts wiring, ServiceContactForm canonical instant); this run verified with full suite
  (137/137 green) + typecheck, marked all tasks complete, committed as one work-unit.
