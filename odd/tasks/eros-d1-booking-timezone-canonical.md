# ODD Feature — eros-d1-booking-timezone-canonical

> **Búsqueda:** keywords: `timezone, ART, wall-clock, getBookedSlots, CustomTimePicker, booking, timezone-canonical, EROS-D1` · clasificación: `odd-feature` · estado: in-progress · actualizado: 2026-10-01

## Objective
One canonical timezone for the whole public booking flow: every "HH:mm" / "YYYY-MM-DD" value exchanged between server and client is wall-clock business time (America/Argentina/Buenos_Aires, fixed UTC-3), while absolute instants (epoch/ISO) remain the only thing compared or persisted.

## Problem / Why
Audit finding EROS-D1 (P2, 34-auditor 2026-09-30): `getBookedSlots` built its "HH:mm" strings with `getUTCHours()/getUTCMinutes()` and queried a UTC day window (`T00:00:00Z`..`T23:59:59Z`), while `CustomTimePicker` compares those strings against wall-clock ART hours and `ServiceContactForm` submits `new Date(y, m-1, d, hh, mm)` in server-local time. In Argentina (UTC-3) every "Reservado" mark was shifted 3 hours: a real 15:00 appointment showed as booked at 18:00 and 15:00 looked free. The server-side anti-overbooking guard compares absolutes and still rejects, so this is wrong availability UX, not double-booking. Same defect class in `getNextAvailableSlots` (auditor note, appointments.ts:913).

## Scope
- In: `src/lib/timezone.ts` (canonical helpers, Intl-only, zero new deps) + unit tests; `getBookedSlots` (ART day window + ART labels); `getNextAvailableSlots` (ART business-day walk + ART labels, no productive callers today but must not carry the drift); `ServiceContactForm.handleSubmit` (ART instant construction); ADR-0002 documenting the canonical; this ODD doc.
- Out: `checkSlotAvailability` (compares absolutes, verified OK by auditor — its local-day window is a separate concern); E2E Supabase stubbing (separate ticket); DST handling beyond correctness via Intl (Argentina has no DST since 2009).

## Constraints
- TDD strict (RED→GREEN→REFACTOR), runner vitest, `environment: 'node'` (no jsdom yet — pure logic tests).
- Tests assert absolute UTC instants (TZ-of-process invariant), never runner-local times.
- No new dependencies (Intl only). TS strict. Conventional Commits, no Co-Authored-By.
- Branch: `feat/eros-deps`. Auto-pilot commit rules (dev-protocol): gates green → commit + push to working branch.

## Tasks (stable IDs)
- [x] T1: RED — `src/lib/timezone.test.ts` pinning the canonical helpers contract (ART wall-clock ↔ epoch, ART day bounds, process-TZ invariance).
- [x] T2: GREEN — `src/lib/timezone.ts`: `BUSINESS_TIME_ZONE`, `zonedWallClockMs`, `formatWallClockHHmm`, `artDayBounds`, `artDateStr`, `artTodayDateStr`. Evidence: `vitest run src/lib/timezone.test.ts` 11/11 pass (2026-10-02).
- [x] T3: RED — `getBookedSlots` tests: a 15:00 ART appointment blocks exactly slot "15:00" (not "18:00"); ART day window captures a 22:00 ART booking whose UTC date is the next day. Pinning tests live in `src/lib/booking-slots.test.ts` against the extracted pure helpers (`slotsOccupiedByAppointment`, `mergeOccupiedLabels`, `toOccupiedAppointments`) — the DB-touching wrapper delegates to them; 13/13 pass.
- [x] T4: GREEN — `getBookedSlots` uses `artDayBounds` + ART labels via `booking-slots.ts` (`mergeOccupiedLabels` + `toOccupiedAppointments` + `slotsOccupiedByAppointment`).
- [x] T5: RED→GREEN — `getNextAvailableSlots` aligned to ART canonical (window via `artDayBounds(nowDateStr)` + 29-day walk; blocked times as ART wall-clock resolved via `zonedWallClockMs`; slot walk via `nextAvailableArtSlots` pure helper with `nowMs` injection — fake-clock-testable).
- [x] T6: GREEN — `ServiceContactForm.handleSubmit` builds the instant via `zonedWallClockMs(formData.appointmentDate, formData.appointmentTime)`.
- [x] T7: ADR-0002 (`docs/adr/0002-timezone-canonical.md`) + `tsc --noEmit` clean + full suite 137/137 green + work-unit commit (this run).
  - evidence: vitest run (all 16 files) 137/137 pass; `tsc --noEmit` 0 errors — 2026-10-02, run g0-eros-noche.

## Accumulated evidence
- 2026-10-01: drift confirmed on live code — `getBookedSlots` labels UTC (appointments.ts:350), picker compares wall-clock (CustomTimePicker.tsx:141-142), form submits local `new Date` (ServiceContactForm.tsx:587-596), `getNextAvailableSlots` labels UTC (appointments.ts:913). `getNextAvailableSlots` has no productive callers (grep verified).
- 2026-10-01: canonical precedent in repo — 4× `Intl.DateTimeFormat(..., { timeZone: 'America/Argentina/Buenos_Aires' })` in appointments.ts emails + reminders route.ts:72.

## Accepted changes and rationale
- Canonical = ART wall-clock for labels/exchange; absolutes for comparison/persistence. Rationale: the picker, business hours config and blocked times are all wall-clock by product design (business 9-18 ART); ART is already the presentation standard in every email path.
- `checkSlotAvailability` intentionally untouched (absolute-time guard, out of scope).

## Next step
None — feature complete. Close loop via work-unit commit (this run) and move ODD doc to `completed`.

## Progress
- 2026-10-01: task taken (run 1042). Diagnosis verified, ODD doc created.
- 2026-10-01: T1 RED + T2 GREEN (`timezone.ts` + 11 tests green).
- 2026-10-02: T3–T6 already implemented on the tree from prior run (booking-slots.ts extraction, appointments.ts wiring, ServiceContactForm canonical instant); this run verified with full suite (137/137 green) + typecheck, marked all tasks complete, committed as one work-unit.
