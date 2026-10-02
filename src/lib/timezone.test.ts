/**
 * EROS-D1 — canonical timezone contract.
 *
 * The business operates in America/Argentina/Buenos_Aires (ART, fixed
 * UTC-3, no DST since 2009). Every "HH:mm" / "YYYY-MM-DD" value exchanged
 * between server and client (booked-slot labels, picker options, business
 * hours, blocked times, form submit) is ART WALL-CLOCK. Absolute instants
 * (epoch ms / ISO strings) are the only thing compared, stored or
 * persisted.
 *
 * All assertions here are ABSOLUTE (UTC instants / fixed strings), so the
 * suite is invariant to the timezone of the machine running vitest.
 */
import { describe, expect, it } from 'vitest';

import {
  artDayBounds,
  BUSINESS_TIME_ZONE,
  formatWallClockHHmm,
  zonedDateStr,
  zonedWallClockMs,
} from './timezone';

describe('timezone — canonical constants', () => {
  it('pins the business time zone to America/Argentina/Buenos_Aires', () => {
    // The same zone every email/reminders Intl formatter already uses
    // (appointments.ts, api/cron/reminders/route.ts). One constant, no drift.
    expect(BUSINESS_TIME_ZONE).toBe('America/Argentina/Buenos_Aires');
  });
});

describe('timezone — ART wall-clock → absolute instant', () => {
  it('converts 15:00 ART on 2026-10-01 to 18:00:00Z (fixed UTC-3)', () => {
    // THE EROS-D1 regression: a real 15:00 ART appointment must resolve to
    // the 18:00Z instant — never 15:00Z.
    expect(zonedWallClockMs('2026-10-01', '15:00')).toBe(Date.UTC(2026, 9, 1, 18, 0));
  });

  it('converts early-morning ART times across the UTC day boundary', () => {
    // 00:30 ART Oct 1 === 03:30Z Oct 1 (same UTC date)
    expect(zonedWallClockMs('2026-10-01', '00:30')).toBe(Date.UTC(2026, 9, 1, 3, 30));
    // 23:45 ART Oct 1 === 02:45Z Oct 2 (next UTC date)
    expect(zonedWallClockMs('2026-10-01', '23:45')).toBe(Date.UTC(2026, 9, 2, 2, 45));
  });

  it('round-trips every picker label back to the same label', () => {
    for (const hhmm of ['00:00', '09:00', '12:30', '15:00', '18:45', '23:45']) {
      const instant = zonedWallClockMs('2026-10-01', hhmm);
      expect(formatWallClockHHmm(instant)).toBe(hhmm);
    }
  });
});

describe('timezone — absolute instant → ART wall-clock', () => {
  it('formats 18:00Z as 15:00 (the slot the picker must show as booked)', () => {
    expect(formatWallClockHHmm(Date.UTC(2026, 9, 1, 18, 0))).toBe('15:00');
  });

  it('formats UTC midnight as 21:00 ART of the previous day', () => {
    expect(formatWallClockHHmm(Date.UTC(2026, 9, 2, 0, 0))).toBe('21:00');
  });

  it('zero-pads hours and minutes to HH:mm', () => {
    expect(formatWallClockHHmm(Date.UTC(2026, 9, 1, 12, 5))).toBe('09:05');
  });
});

describe('timezone — ART calendar date of an instant', () => {
  it('maps 02:59Z Oct 1 to ART date 2026-09-30 and 03:01Z to 2026-10-01', () => {
    // An instant can belong to a different ART calendar date than its UTC
    // date — this is exactly what the old UTC day-window query missed.
    expect(zonedDateStr(Date.UTC(2026, 9, 1, 2, 59))).toBe('2026-09-30');
    expect(zonedDateStr(Date.UTC(2026, 9, 1, 3, 1))).toBe('2026-10-01');
  });
});

describe('timezone — ART day bounds for availability queries', () => {
  it('bounds 2026-10-01 as [03:00Z Oct 1, 03:00Z Oct 2)', () => {
    const { startMs, endExclusiveMs } = artDayBounds('2026-10-01');
    expect(startMs).toBe(Date.UTC(2026, 9, 1, 3, 0));
    expect(endExclusiveMs).toBe(Date.UTC(2026, 9, 2, 3, 0));
  });

  it('includes a 22:00 ART booking whose UTC instant is on the next UTC date', () => {
    // 22:00 ART Oct 1 === 01:00Z Oct 2 — invisible to the old
    // [T00:00:00Z, T23:59:59Z] window, must be inside the ART bounds.
    const { startMs, endExclusiveMs } = artDayBounds('2026-10-01');
    const at2200Art = zonedWallClockMs('2026-10-01', '22:00');
    expect(at2200Art).toBe(Date.UTC(2026, 9, 2, 1, 0));
    expect(at2200Art).toBeGreaterThanOrEqual(startMs);
    expect(at2200Art).toBeLessThan(endExclusiveMs);
  });

  it('excludes the last instant of the previous ART day and the first of the next', () => {
    const { startMs, endExclusiveMs } = artDayBounds('2026-10-01');
    // 23:59 ART Sep 30 === 02:59Z Oct 1 — belongs to Sep 30, not Oct 1.
    expect(zonedWallClockMs('2026-09-30', '23:59')).toBeLessThan(startMs);
    // 00:00 ART Oct 2 === 03:00Z Oct 2 — belongs to Oct 2, not Oct 1.
    expect(endExclusiveMs).toBe(zonedWallClockMs('2026-10-02', '00:00'));
  });
});
