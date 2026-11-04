/**
 * EROS-D1 — shared appointment date helpers (ADR-0002).
 *
 * Centralizes date parsing/formatting for appointments across the codebase.
 * All helpers use ART (America/Argentina/Buenos_Aires, fixed UTC-3, no DST).
 */

import { zonedWallClockMs, zonedDateStr, formatWallClockHHmm, artDayBounds } from "./timezone";

/**
 * Parses a "YYYY-MM-DD" date string into a local Date at noon (12:00).
 * Used for display formatting where timezone doesn't matter — just need
 * a stable Date object for .toLocaleDateString() etc.
 *
 * @param dateStr - "YYYY-MM-DD" format
 * @returns Date at 12:00:00 local time (browser timezone)
 */
export function parseLocalDate(dateStr: string): Date {
	const [y, m, d] = dateStr.split("-").map(Number);
	return new Date(y, m - 1, d, 12, 0, 0);
}

/**
 * Parses an ART wall-clock date + time into an absolute epoch-ms instant.
 * This is the CANONICAL way to convert form input (date + time) to the
 * instant that gets stored in the DB and compared for availability.
 *
 * @param dateStr - "YYYY-MM-DD" ART calendar date
 * @param hhmm    - "HH:mm" ART wall-clock time
 * @returns epoch milliseconds (absolute instant)
 *
 * @example
 * parseAppointmentDate("2026-10-01", "15:00") // → 1790887200000 (epoch ms)
 */
export function parseAppointmentDate(dateStr: string, hhmm: string): number {
	return zonedWallClockMs(dateStr, hhmm);
}

/**
 * Formats an absolute instant (epoch ms) as "YYYY-MM-DD" ART calendar date.
 *
 * @param instantMs - epoch milliseconds
 * @returns "YYYY-MM-DD" in ART
 */
export function formatAppointmentDate(instantMs: number): string {
	return zonedDateStr(instantMs);
}

/**
 * Formats an absolute instant (epoch ms) as "HH:mm" ART wall-clock time.
 *
 * @param instantMs - epoch milliseconds
 * @returns "HH:mm" in ART (24h format)
 */
export function formatAppointmentTime(instantMs: number): string {
	return formatWallClockHHmm(instantMs);
}

/**
 * Formats an absolute instant as a full ART date+time string for display.
 *
 * @param instantMs - epoch milliseconds
 * @param options - Intl.DateTimeFormat options (optional)
 * @returns formatted string like "1 de octubre de 2026 a las 15:00"
 */
export function formatAppointmentDateTime(
	instantMs: number,
	options?: Intl.DateTimeFormatOptions
): string {
	const defaultOptions: Intl.DateTimeFormatOptions = {
		dateStyle: "full",
		timeStyle: "short",
		timeZone: "America/Argentina/Buenos_Aires",
		...options,
	};
	return new Intl.DateTimeFormat("es-AR", defaultOptions).format(
		new Date(instantMs)
	);
}

/**
 * Returns the [startMs, endExclusiveMs) window for an ART calendar day.
 * Used for availability queries so appointments at 22:00 ART (01:00Z next
 * UTC day) are captured for the correct ART day.
 *
 * @param dateStr - "YYYY-MM-DD" ART calendar date
 * @returns { startMs, endExclusiveMs }
 */
export function getAppointmentDayBounds(dateStr: string): {
	startMs: number;
	endExclusiveMs: number;
} {
	return artDayBounds(dateStr);
}

/**
 * Checks if an appointment instant falls within an ART calendar day.
 *
 * @param appointmentMs - appointment instant (epoch ms)
 * @param dateStr - "YYYY-MM-DD" ART calendar date
 * @returns true if appointment is on that ART day
 */
export function isAppointmentOnDate(
	appointmentMs: number,
	dateStr: string
): boolean {
	const { startMs, endExclusiveMs } = artDayBounds(dateStr);
	return appointmentMs >= startMs && appointmentMs < endExclusiveMs;
}

/**
 * Parses an ISO string from the database into ART date and time components.
 *
 * @param isoString - ISO timestamp from DB (e.g., "2026-10-01T18:00:00.000Z")
 * @returns { date: "YYYY-MM-DD", time: "HH:mm" } in ART
 */
export function parseDbAppointment(isoString: string): {
	date: string;
	time: string;
} {
	const instantMs = new Date(isoString).getTime();
	return {
		date: zonedDateStr(instantMs),
		time: formatWallClockHHmm(instantMs),
	};
}

/**
 * Creates a sort key for appointments that sorts by ART date then time.
 * Useful for Array.sort() on appointment arrays.
 *
 * @param instantMs - appointment instant (epoch ms)
 * @returns number suitable for sorting (ms since epoch in ART timezone context)
 */
export function appointmentSortKey(instantMs: number): number {
	// The epoch ms already sorts correctly for absolute ordering
	return instantMs;
}

/**
 * Type for appointment date/time parts
 */
export interface AppointmentDateTimeParts {
	date: string; // "YYYY-MM-DD"
	time: string; // "HH:mm"
}

/**
 * Splits an appointment instant into date and time parts for form inputs.
 *
 * @param instantMs - appointment instant (epoch ms)
 * @returns { date: "YYYY-MM-DD", time: "HH:mm" }
 */
export function splitAppointmentDateTime(
	instantMs: number
): AppointmentDateTimeParts {
	return {
		date: zonedDateStr(instantMs),
		time: formatWallClockHHmm(instantMs),
	};
}