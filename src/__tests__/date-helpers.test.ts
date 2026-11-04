import { describe, it, expect } from "vitest";

/**
 * Tests for date-helpers shared module
 */

describe("Date Helpers", () => {
	describe("parseLocalDate", () => {
		it("should parse YYYY-MM-DD to Date at noon", async () => {
			const { parseLocalDate } = await import("@/lib/date-helpers");

			const date = parseLocalDate("2026-10-01");

			expect(date.getFullYear()).toBe(2026);
			expect(date.getMonth()).toBe(9); // 0-indexed
			expect(date.getDate()).toBe(1);
			expect(date.getHours()).toBe(12);
			expect(date.getMinutes()).toBe(0);
			expect(date.getSeconds()).toBe(0);
		});

		it("should handle different dates correctly", async () => {
			const { parseLocalDate } = await import("@/lib/date-helpers");

			const date1 = parseLocalDate("2026-01-15");
			expect(date1.getFullYear()).toBe(2026);
			expect(date1.getMonth()).toBe(0);
			expect(date1.getDate()).toBe(15);

			const date2 = parseLocalDate("2026-12-31");
			expect(date2.getFullYear()).toBe(2026);
			expect(date2.getMonth()).toBe(11);
			expect(date2.getDate()).toBe(31);
		});
	});

	describe("parseAppointmentDate", () => {
		it("should parse ART date and time to epoch ms", async () => {
			const { parseAppointmentDate } = await import("@/lib/date-helpers");

			// 2026-10-01 15:00 ART = 2026-10-01T18:00:00.000Z (UTC-3)
			const instant = parseAppointmentDate("2026-10-01", "15:00");

			expect(typeof instant).toBe("number");
			expect(instant).toBeGreaterThan(0);
		});

		it("should produce consistent results for same input", async () => {
			const { parseAppointmentDate } = await import("@/lib/date-helpers");

			const instant1 = parseAppointmentDate("2026-10-01", "15:00");
			const instant2 = parseAppointmentDate("2026-10-01", "15:00");

			expect(instant1).toBe(instant2);
		});

		it("should produce different results for different times", async () => {
			const { parseAppointmentDate } = await import("@/lib/date-helpers");

			const instant1 = parseAppointmentDate("2026-10-01", "15:00");
			const instant2 = parseAppointmentDate("2026-10-01", "16:00");

			expect(instant2 - instant1).toBe(60 * 60 * 1000); // 1 hour difference
		});
	});

	describe("formatAppointmentDate", () => {
		it("should format instant as ART date string", async () => {
			const { parseAppointmentDate, formatAppointmentDate } = await import(
				"@/lib/date-helpers"
			);

			const instant = parseAppointmentDate("2026-10-01", "15:00");
			const dateStr = formatAppointmentDate(instant);

			expect(dateStr).toBe("2026-10-01");
		});
	});

	describe("formatAppointmentTime", () => {
		it("should format instant as ART time string", async () => {
			const { parseAppointmentDate, formatAppointmentTime } = await import(
				"@/lib/date-helpers"
			);

			const instant = parseAppointmentDate("2026-10-01", "15:00");
			const timeStr = formatAppointmentTime(instant);

			expect(timeStr).toBe("15:00");
		});
	});

	describe("formatAppointmentDateTime", () => {
		it("should format instant as full ART date/time string", async () => {
			const { parseAppointmentDate, formatAppointmentDateTime } = await import(
				"@/lib/date-helpers"
			);

			const instant = parseAppointmentDate("2026-10-01", "15:00");
			const formatted = formatAppointmentDateTime(instant);

			expect(formatted).toContain("1 de octubre de 2026");
			expect(formatted).toContain("3:00 p. m."); // es-AR locale uses 12h format with p.m.
		});
	});

	describe("getAppointmentDayBounds", () => {
		it("should return start and end bounds for ART day", async () => {
			const { getAppointmentDayBounds } = await import("@/lib/date-helpers");

			const bounds = getAppointmentDayBounds("2026-10-01");

			expect(bounds.startMs).toBeLessThan(bounds.endExclusiveMs);
			expect(bounds.endExclusiveMs - bounds.startMs).toBe(24 * 60 * 60 * 1000);
		});
	});

	describe("isAppointmentOnDate", () => {
		it("should return true for appointment on the date", async () => {
			const { parseAppointmentDate, isAppointmentOnDate } = await import(
				"@/lib/date-helpers"
			);

			const instant = parseAppointmentDate("2026-10-01", "15:00");
			const result = isAppointmentOnDate(instant, "2026-10-01");

			expect(result).toBe(true);
		});

		it("should return false for appointment on different date", async () => {
			const { parseAppointmentDate, isAppointmentOnDate } = await import(
				"@/lib/date-helpers"
			);

			const instant = parseAppointmentDate("2026-10-01", "15:00");
			const result = isAppointmentOnDate(instant, "2026-10-02");

			expect(result).toBe(false);
		});
	});

	describe("parseDbAppointment", () => {
		it("should parse ISO string to ART date and time", async () => {
			const { parseDbAppointment } = await import("@/lib/date-helpers");

			// 2026-10-01T18:00:00.000Z = 2026-10-01 15:00 ART
			const result = parseDbAppointment("2026-10-01T18:00:00.000Z");

			expect(result.date).toBe("2026-10-01");
			expect(result.time).toBe("15:00");
		});
	});

	describe("splitAppointmentDateTime", () => {
		it("should split instant into date and time parts", async () => {
			const { parseAppointmentDate, splitAppointmentDateTime } = await import(
				"@/lib/date-helpers"
			);

			const instant = parseAppointmentDate("2026-10-01", "15:00");
			const parts = splitAppointmentDateTime(instant);

			expect(parts.date).toBe("2026-10-01");
			expect(parts.time).toBe("15:00");
		});
	});

	describe("appointmentSortKey", () => {
		it("should return epoch ms for sorting", async () => {
			const { parseAppointmentDate, appointmentSortKey } = await import(
				"@/lib/date-helpers"
			);

			const instant = parseAppointmentDate("2026-10-01", "15:00");
			const key = appointmentSortKey(instant);

			expect(key).toBe(instant);
			expect(typeof key).toBe("number");
		});
	});
});