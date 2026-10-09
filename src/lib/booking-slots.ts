/**
 * EROS-D1 — pure slot-occupancy logic, timezone-canonical (ADR-0002).
 *
 * Extracted from `getBookedSlots` / `getNextAvailableSlots` so the
 * wall-clock arithmetic is testable without the Supabase server stack
 * ('use server' modules with next/cache + web-push imports don't load
 * under vitest's node environment).
 *
 * CANONICAL CONTRACT: every "HH:mm" / "YYYY-MM-DD" is ART wall-clock
 * (BUSINESS_TIME_ZONE); every absolute is epoch ms / ISO. See
 * src/lib/timezone.ts (ADR-0002).
 */
import { artDayBounds, formatWallClockHHmm, zonedDateStr, zonedWallClockMs } from './timezone';

/**
 * One non-cancelled appointment as seen by the occupancy calculator:
 * absolute start + effective duration. Duration comes from the linked
 * service, falling back to `defaultDurationMinutes` when missing.
 */
export interface OccupiedAppointment {
  appointmentDate: string; // ISO instant (absolute)
  durationMinutes: number; // effective service duration
}

/**
 * All 15-minute ART wall-clock slots covered by one appointment.
 *
 * THE EROS-D1 REGRESSION this replaces: the old code labeled each slot
 * with getUTCHours()/getUTCMinutes(), so in Argentina (UTC-3) a real
 * 15:00 appointment blocked "18:00" and left "15:00" free — every
 * "Reservado" mark was shifted 3 hours.
 */
export function slotsOccupiedByAppointment(
  appointmentDateIso: string,
  durationMinutes: number
): string[] {
  const startMs = new Date(appointmentDateIso).getTime();
  const slotCount = Math.ceil(durationMinutes / 15);

  const labels: string[] = [];
  for (let i = 0; i < slotCount; i++) {
    labels.push(formatWallClockHHmm(startMs + i * 15 * 60 * 1000));
  }
  return labels;
}

/**
 * Sort + dedupe occupancy labels, e.g. ["09:00", "10:00"] from two rows.
 */
export function mergeOccupiedLabels(labels: string[][]): string[] {
  const unique = new Set(labels.flat());
  return [...unique].sort((a, b) => a.localeCompare(b));
}

/**
 * Build the row objects feeding `slotsOccupiedByAppointment` from the
 * non-PII Supabase projection (appointment_date, services.duration).
 */
export function toOccupiedAppointments(
  rows: Array<{
    appointment_date: string;
    services?: { duration?: number } | null;
  }>,
  defaultDurationMinutes: number
): OccupiedAppointment[] {
  return (rows ?? []).map((row) => ({
    appointmentDate: row.appointment_date,
    durationMinutes: row.services?.duration || defaultDurationMinutes,
  }));
}

/**
 * Whether the ART day-window query [start, end) for `dateStr` would
 * capture the given ISO instant — used by tests to pin the day-window
 * semantics; exported for reuse by getNextAvailableSlots.
 */
export function isWithinArtDay(dateStr: string, iso: string): boolean {
  const { startMs, endExclusiveMs } = artDayBounds(dateStr);
  const t = new Date(iso).getTime();
  return t >= startMs && t < endExclusiveMs;
}

/**
 * Next-N available slots walking ART business days forward (backing
 * `getNextAvailableSlots`). Business hours and slot labels are ART
 * wall-clock; overlap is checked against absolute occupied windows.
 */
export function nextAvailableArtSlots({
  nowMs,
  businessHours,
  durationMinutes,
  occupied,
  count,
}: {
  nowMs: number;
  businessHours: Record<string, { closed: boolean; start: string; end: string }>;
  durationMinutes: number;
  occupied: Array<{ start: number; end: number }>;
  count: number;
}): Array<{ date: string; time: string; datetime: string }> {
  const slotMs = durationMinutes * 60000;
  const stepMs = 30 * 60000; // 30-minute grid, matches legacy behavior
  const available: Array<{ date: string; time: string; datetime: string }> = [];

  // Walk ART calendar days starting at the ART "today" of nowMs.
  const firstDayMs = zonedWallClockMs(zonedDateStr(nowMs), '00:00');
  const DAY_MS = 24 * 60 * 60 * 1000;

  for (let d = 0; d < 30 && available.length < count; d++) {
    const dateStr = zonedDateStr(firstDayMs + d * DAY_MS);
    const weekday = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
      new Date(`${dateStr}T00:00:00Z`).getUTCDay()
    ];
    // HISTORIC: `weekday` is bounded to the 7 hardcoded day-name strings
    // above (indexed by getUTCDay(), 0-6). `businessHours[weekday]` can
    // only ever fetch one of those 7 keys; the object content comes from
    // admin settings, not client input — no prototype-injection path.
    // eslint-disable-next-line security/detect-object-injection
    const bh = businessHours[weekday];
    if (!bh || bh.closed) {
      continue;
    }

    const dayStartMs = zonedWallClockMs(dateStr, bh.start);
    const dayEndMs = zonedWallClockMs(dateStr, bh.end);

    for (
      let cur = dayStartMs;
      cur + slotMs <= dayEndMs && available.length < count;
      cur += stepMs
    ) {
      // Only future slots, never in the past relative to nowMs.
      if (cur < nowMs) {
        continue;
      }
      const overlaps = occupied.some((w) => cur < w.end && cur + slotMs > w.start);
      if (!overlaps) {
        available.push({
          date: dateStr,
          time: formatWallClockHHmm(cur),
          datetime: new Date(cur).toISOString(),
        });
      }
    }
  }
  return available;
}
