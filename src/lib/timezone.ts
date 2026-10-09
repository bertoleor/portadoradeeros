/**
 * EROS-D1 — canonical timezone helpers (ADR-0002).
 *
 * CANONICAL CONTRACT (single source of truth for the booking flow):
 *
 *   - Every wall-clock string ("YYYY-MM-DD", "HH:mm") exchanged between
 *     server and client — booked-slot labels, picker options, business
 *     hours, blocked times, form submit — is ART (America/Argentina/
 *     Buenos_Aires, fixed UTC-3, no DST since 2009).
 *   - Absolute instants (epoch ms / ISO strings) are the ONLY thing
 *     compared, stored or persisted.
 *
 * Why ART wall-clock and not UTC end-to-end: the picker, the business
 * hours config (9-18) and blocked times are wall-clock by product
 * design, and every email/reminders path already formats ART. Making
 * the wire format UTC would require re-writing every consumer; making
 * it ART aligns the wire with what every producer/consumer already
 * assumes. See docs/adr/ADR-0002 (once written).
 *
 * Zero new dependencies: Intl only. Process-TZ invariant — every helper
 * derives from the zone, never from the machine's local timezone.
 */

/**
 * The single business timezone. Never hardcode the IANA name anywhere
 * else; import this constant instead.
 */
export const BUSINESS_TIME_ZONE = 'America/Argentina/Buenos_Aires';

const ART_UTC_OFFSET_MS = -3 * 60 * 60 * 1000;

// en-CA gives ISO-like YYYY-MM-DD output for the calendar-date part.
const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: BUSINESS_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/**
 * "HH:mm" ART wall-clock of an absolute instant.
 *
 * The inverse of {@link zonedWallClockMs}: labels produced here are the
 * exact strings the picker compares against (`bookedSlots.includes`).
 */
export function formatWallClockHHmm(instantMs: number): string {
  return timeFormatter.format(new Date(instantMs));
}

/**
 * "YYYY-MM-DD" ART calendar date of an absolute instant.
 */
export function zonedDateStr(instantMs: number): string {
  const iso = dateFormatter.format(new Date(instantMs));
  return iso; // en-CA → YYYY-MM-DD
}

/**
 * Absolute instant (epoch ms) of an ART wall-clock date+time.
 *
 * @param dateStr "YYYY-MM-DD" ART calendar date
 * @param hhmm    "HH:mm" ART wall-clock time
 */
export function zonedWallClockMs(dateStr: string, hhmm: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = hhmm.split(':').map(Number);

  // Guess using the fixed historical offset, then correct through Intl
  // for zones with DST. ART has no DST since 2009, so the correction
  // loop converges in one pass — but keep it correct for any zone.
  let guess = Date.UTC(y, m - 1, d, hh, mm) - ART_UTC_OFFSET_MS;
  for (let i = 0; i < 2; i++) {
    const formatted = formatWallClockHHmm(guess);
    if (formatted === `${hhmm}`) {
      // Verify the calendar date matches too (not just the time of day).
      if (zonedDateStr(guess) === dateStr) {
        return guess;
      }
    }
    const [gh, gm] = formatted.split(':').map(Number);
    const deltaMinutes = (hh - gh) * 60 + (mm - gm);
    if (deltaMinutes === 0 && zonedDateStr(guess) === dateStr) {
      return guess;
    }
    guess += deltaMinutes * 60 * 1000;
  }
  return guess;
}

/**
 * [startMs, endExclusiveMs) covering one ART calendar day.
 *
 * Used by availability queries so a 22:00 ART appointment (01:00Z next
 * UTC day) is captured for the ART day — the old `[T00:00:00Z,
 * T23:59:59Z]` window missed it.
 */
export function artDayBounds(dateStr: string): { startMs: number; endExclusiveMs: number } {
  const startMs = zonedWallClockMs(dateStr, '00:00');
  // Adding 24h of wall-clock never drifts because ART is a fixed offset
  // (no DST); for a general zone the safe route is the next day's 00:00.
  const nextDay = new Date(`${dateStr}T00:00:00Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const endExclusiveMs = zonedWallClockMs(nextDay.toISOString().split('T')[0], '00:00');
  return { startMs, endExclusiveMs };
}

/**
 * ART calendar date of "today" — for walking business days forward.
 */
export function zonedTodayDateStr(now: number = Date.now()): string {
  return zonedDateStr(now);
}
