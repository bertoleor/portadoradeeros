import { describe, it, expect } from "vitest";

/**
 * Tests for getAppointmentsPaginated function
 * These are integration tests that require Next.js request context (cookies)
 * They are skipped in unit test environment but work in integration tests.
 */

describe.skip("getAppointmentsPaginated", () => {
	describe("basic pagination", () => {
		it("should return paginated results with metadata", async () => {
			const { getAppointmentsPaginated } = await import("@/lib/api/appointments");

			const result = await getAppointmentsPaginated({ page: 1, pageSize: 10 });

			expect(result).toHaveProperty("data");
			expect(result).toHaveProperty("total");
			expect(result).toHaveProperty("page", 1);
			expect(result).toHaveProperty("pageSize", 10);
			expect(Array.isArray(result.data)).toBe(true);
			expect(typeof result.total).toBe("number");
		});

		it("should respect pageSize limit", async () => {
			const { getAppointmentsPaginated } = await import("@/lib/api/appointments");

			const result = await getAppointmentsPaginated({ page: 1, pageSize: 3 });

			expect(result.data.length).toBeLessThanOrEqual(3);
			expect(result.pageSize).toBe(3);
		});

		it("should return correct page number", async () => {
			const { getAppointmentsPaginated } = await import("@/lib/api/appointments");

			const result = await getAppointmentsPaginated({ page: 2, pageSize: 10 });

			expect(result.page).toBe(2);
		});
	});

	describe("filtering", () => {
		it("should filter by status when provided", async () => {
			const { getAppointmentsPaginated } = await import("@/lib/api/appointments");

			const result = await getAppointmentsPaginated({
				page: 1,
				pageSize: 10,
				status: "confirmed",
			});

			expect(result.data.every((a) => a.status === "confirmed")).toBe(true);
		});
	});

	describe("month/year filtering", () => {
		it("should accept month and year parameters", async () => {
			const { getAppointmentsPaginated } = await import("@/lib/api/appointments");

			const result = await getAppointmentsPaginated({
				page: 1,
				pageSize: 10,
				month: 10,
				year: 2026,
			});

			expect(result).toHaveProperty("data");
			expect(Array.isArray(result.data)).toBe(true);
		});
	});
});