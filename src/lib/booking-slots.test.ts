/**
 * EROS-D1 — slot-occupancy contract (ADR-0002).
 *
 * Pins the EROS-D1 regression: a real 15:00 ART appointment must block
 * exactly slot "15:00" — never "18:00" — and the ART day window must
 * capture late-evening ART bookings whose UTC instant falls on the next
 * UTC date. All assertions are absolute (UTC instants / fixed strings),
 * invariant to the timezone of the machine running vitest.
 */
import { describe, expect, it } from 'vitest';

import {
  isWithinArtDay,
  mergeOccupiedLabels,
  nextAvailableArtSlots,
  slotsOccupiedByAppointment,
  toOccupiedAppointments,
} from './booking-slots';
import { zonedWallClockMs } from './timezone';

// 15:00 ART on 2026-10-01 === 18:00Z — the exact EROS-D1 finding.
const AT_15_00_ART = '2026-10-01T18:00:00.000Z';
// 22:00 ART on 2026-10-01 === 01:00Z on 2026-10-02 (next UTC date).
const AT_22_00_ART = '2026-10-02T01:00:00.000Z';

describe('slotsOccupiedByAppointment — ART labels', () => {
  it('THE EROS-D1 REGRESSION: a 15:00 ART appointment blocks "15:00", not "18:00"', () => {
    const slots = slotsOccupiedByAppointment(AT_15_00_ART, 60);
    expect(slots).toContain('15:00');
    expect(slots).not.toContain('18:00');
    expect(slots).toEqual(['15:00', '15:15', '15:30', '15:45']);
  });

  it('labels every 15-min slot of a 90-minute service (crossing the hour)', () => {
    const start = new Date(zonedWallClockMs('2026-10-01', '09:30')).toISOString();
    const slots = slotsOccupiedByAppointment(start, 90);
    expect(slots).toEqual(['09:30', '09:45', '10:00', '10:15', '10:30', '10:45']);
  });

  it('a 22:00 ART appointment labels "22:00" even though its UTC hour is 01', () => {
    const slots = slotsOccupiedByAppointment(AT_22_00_ART, 60);
    expect(slots[0]).toBe('22:00');
    expect(slots).not.toContain('01:00');
  });
});

describe('isWithinArtDay — ART day-window semantics', () => {
  it('captures a 22:00 ART booking whose UTC instant is on the next UTC date', () => {
    // The old [T00:00:00Z, T23:59:59Z] window missed this row entirely.
    expect(isWithinArtDay('2026-10-01', AT_22_00_ART)).toBe(true);
  });

  it('excludes a 00:15 ART Oct 2 booking from the Oct 1 window (03:15Z Oct 2)', () => {
    const at0015ArtOct2 = new Date(zonedWallClockMs('2026-10-02', '00:15')).toISOString();
    expect(isWithinArtDay('2026-10-01', at0015ArtOct2)).toBe(false);
    expect(isWithinArtDay('2026-10-02', at0015ArtOct2)).toBe(true);
  });
});

describe('toOccupiedAppointments + mergeOccupiedLabels — Supabase projection', () => {
  it('falls back to the default duration when the service has none', () => {
    const [row] = toOccupiedAppointments([{ appointment_date: AT_15_00_ART, services: null }], 45);
    expect(row.durationMinutes).toBe(45);
  });

  it('uses the service duration when present', () => {
    const [row] = toOccupiedAppointments(
      [{ appointment_date: AT_15_00_ART, services: { duration: 30 } }],
      45
    );
    expect(row.durationMinutes).toBe(30);
  });

  it('dedupes overlapping labels from two appointments and sorts them', () => {
    const rows = [
      { appointment_date: AT_15_00_ART, services: { duration: 60 } },
      {
        appointment_date: new Date(zonedWallClockMs('2026-10-01', '15:30')).toISOString(),
        services: { duration: 30 },
      },
    ];
    const merged = mergeOccupiedLabels(
      toOccupiedAppointments(rows, 60).map((a) =>
        slotsOccupiedByAppointment(a.appointmentDate, a.durationMinutes)
      )
    );
    // Appt 1 (15:00, 60min): 15:00/15:15/15:30/15:45. Appt 2 (15:30, 30min):
    // 15:30/15:45 (already present) → merged set is exactly appt 1's slots.
    expect(merged).toEqual(['15:00', '15:15', '15:30', '15:45']);
  });

  it('handles an empty projection', () => {
    expect(toOccupiedAppointments([], 60)).toEqual([]);
    expect(mergeOccupiedLabels([])).toEqual([]);
  });
});

describe('nextAvailableArtSlots — ART business-day walk', () => {
  // 2026-10-01 is a Thursday; 09-18 ART business hours.
  const businessHours = {
    monday: { closed: false, start: '09:00', end: '18:00' },
    tuesday: { closed: false, start: '09:00', end: '18:00' },
    wednesday: { closed: false, start: '09:00', end: '18:00' },
    thursday: { closed: false, start: '09:00', end: '18:00' },
    friday: { closed: false, start: '09:00', end: '18:00' },
    saturday: { closed: true, start: '09:00', end: '18:00' },
    sunday: { closed: true, start: '09:00', end: '18:00' },
  };

  it('labels slots in ART wall-clock (09:00 ART === 12:00Z, never "12:00" as label)', () => {
    const nowMs = zonedWallClockMs('2026-10-01', '08:00'); // 11:00Z, before opening
    const slots = nextAvailableArtSlots({
      nowMs,
      businessHours,
      durationMinutes: 60,
      occupied: [],
      count: 2,
    });
    expect(slots[0]).toMatchObject({ date: '2026-10-01', time: '09:00' });
    expect(slots[0].datetime).toBe('2026-10-01T12:00:00.000Z');
    expect(slots[1].time).toBe('09:30');
  });

  it('skips slots that overlap an occupied absolute window', () => {
    const nowMs = zonedWallClockMs('2026-10-01', '08:00');
    // A real 09:30 ART booking, 60 min → occupies [12:30Z, 13:30Z).
    const occupied = [
      {
        start: zonedWallClockMs('2026-10-01', '09:30'),
        end: zonedWallClockMs('2026-10-01', '10:30'),
      },
    ];
    const slots = nextAvailableArtSlots({
      nowMs,
      businessHours,
      durationMinutes: 60,
      occupied,
      count: 3,
    });
    // 09:00 (60min) overlaps [09:30,10:30) → blocked. Grid continues 30-min.
    expect(slots.map((s) => s.time)).toEqual(['10:30', '11:00', '11:30']);
  });

  it('never offers past slots when "now" is mid-business-day', () => {
    const nowMs = zonedWallClockMs('2026-10-01', '14:23'); // 17:23Z
    const slots = nextAvailableArtSlots({
      nowMs,
      businessHours,
      durationMinutes: 60,
      occupied: [],
      count: 3,
    });
    // Next 30-min grid slot at/after 14:23 whose 60 min fit before 18:00.
    expect(slots[0].time).toBe('14:30');
    expect(slots.map((s) => s.date)).toEqual(['2026-10-01', '2026-10-01', '2026-10-01']);
  });

  it('walks to the next open ART day (Friday) when Thursday is fully booked', () => {
    const nowMs = zonedWallClockMs('2026-10-01', '08:00');
    const occupied = [
      {
        start: zonedWallClockMs('2026-10-01', '00:00'),
        end: zonedWallClockMs('2026-10-02', '00:00'),
      },
    ];
    const slots = nextAvailableArtSlots({
      nowMs,
      businessHours,
      durationMinutes: 60,
      occupied,
      count: 1,
    });
    expect(slots[0]).toMatchObject({ date: '2026-10-02', time: '09:00' });
  });
});
