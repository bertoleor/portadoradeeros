/**
 * EROS-D1 — RED-proof: the regression tests DISCRIMINATE the old bug.
 *
 * Not part of the suite's permanent contract — this is a one-shot
 * evidence file run once to show that under the OLD UTC labeling the
 * EROS-D1 assertions fail (they are a genuine RED for the defect, not
 * a vacuous green). Kept in the repo as executable documentation.
 */
import { describe, expect, it } from 'vitest';

import { slotsOccupiedByAppointment } from './booking-slots';
import { zonedWallClockMs } from './timezone';

// Exact replica of the PRE-FIX getBookedSlots labeling loop
// (appointments.ts:342-355 @ 8827e8a): getUTCHours/getUTCMinutes.
function oldUtcLabels(appointmentDateIso: string, durationMinutes: number): string[] {
  const startDate = new Date(appointmentDateIso);
  const slotsCount = Math.ceil(durationMinutes / 15);
  const occupiedSlots: string[] = [];
  for (let i = 0; i < slotsCount; i++) {
    const slotTime = new Date(startDate.getTime() + i * 15 * 60 * 1000);
    const timeStr = `${slotTime.getUTCHours().toString().padStart(2, '0')}:${slotTime.getUTCMinutes().toString().padStart(2, '0')}`;
    if (!occupiedSlots.includes(timeStr)) {
      occupiedSlots.push(timeStr);
    }
  }
  return occupiedSlots.sort((a, b) => a.localeCompare(b));
}

describe('EROS-D1 red-proof — old labeling vs canonical', () => {
  const APPOINTMENT_AT_15_00_ART = '2026-10-01T18:00:00.000Z';

  it('OLD code: a 15:00 ART appointment wrongly marks "18:00" as booked', () => {
    const old = oldUtcLabels(APPOINTMENT_AT_15_00_ART, 60);
    expect(old).toContain('18:00'); // the wrong "Reservado" mark
    expect(old).not.toContain('15:00'); // the real slot left free
  });

  it('NEW code: the same appointment blocks exactly 15:00-15:45 ART', () => {
    const fixed = slotsOccupiedByAppointment(APPOINTMENT_AT_15_00_ART, 60);
    expect(fixed).toEqual(['15:00', '15:15', '15:30', '15:45']);
  });

  it('day-window: OLD UTC window missed a 22:00 ART booking, NEW ART bounds capture it', () => {
    // 22:00 ART Oct 1 === 01:00Z Oct 2 — outside the old [T00:00:00Z, T23:59:59Z] Oct 1 window.
    const at2200Art = '2026-10-02T01:00:00.000Z';
    const oldWindowMissedIt =
      new Date(at2200Art) >= new Date('2026-10-01T00:00:00Z') &&
      new Date(at2200Art) <= new Date('2026-10-01T23:59:59Z');
    expect(oldWindowMissedIt).toBe(false); // old query never fetched the row
    expect(zonedWallClockMs('2026-10-01', '22:00')).toBe(new Date(at2200Art).getTime());
  });
});
