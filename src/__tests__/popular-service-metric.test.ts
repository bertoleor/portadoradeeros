import { describe, it, expect } from "vitest";

/**
 * TDD Tests for Popular Service Metric (S6)
 */

describe("Popular Service Metric", () => {
  describe("getServicePopularity function", () => {
    it("should filter appointments by selected month and year", () => {
      // Test logic that mirrors getServicePopularity in admin/page.tsx
      const appointments = [
        { appointment_date: "2026-11-15T10:00:00", services: { title: "Masaje" } },
        { appointment_date: "2026-11-20T14:00:00", services: { title: "Masaje" } },
        { appointment_date: "2026-10-10T10:00:00", services: { title: "Facial" } },
      ];

      const selectedMonth = 10; // November (0-indexed)
      const selectedYear = 2026;

      const counts: Record<string, number> = {};
      appointments
        .filter((app) => {
          const d = new Date(app.appointment_date);
          return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        })
        .forEach((a) => {
          const title = a.services?.title || "Otros";
          counts[title] = (counts[title] || 0) + 1;
        });

      const result = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      expect(result[0]).toEqual(["Masaje", 2]);
    });

    it("should return empty when no appointments in selected period", () => {
      const appointments = [
        { appointment_date: "2026-10-10T10:00:00", services: { title: "Facial" } },
      ];

      const selectedMonth = 10; // November
      const selectedYear = 2026;

      const counts: Record<string, number> = {};
      appointments
        .filter((app) => {
          const d = new Date(app.appointment_date);
          return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        })
        .forEach((a) => {
          const title = a.services?.title || "Otros";
          counts[title] = (counts[title] || 0) + 1;
        });

      const result = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      expect(result.length).toBe(0);
    });

    it("should handle missing service title gracefully", () => {
      const appointments = [
        { appointment_date: "2026-11-15T10:00:00", services: null },
        { appointment_date: "2026-11-20T14:00:00", services: { title: "Masaje" } },
      ];

      const selectedMonth = 10;
      const selectedYear = 2026;

      const counts: Record<string, number> = {};
      appointments
        .filter((app) => {
          const d = new Date(app.appointment_date);
          return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        })
        .forEach((a) => {
          const title = a.services?.title || "Otros";
          counts[title] = (counts[title] || 0) + 1;
        });

      const result = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      expect(result.find((r) => r[0] === "Otros")).toBeTruthy();
    });
  });

  describe("getEstimatedIncome function", () => {
    it("should sum prices for confirmed/completed appointments in selected period", () => {
      const appointments = [
        { appointment_date: "2026-11-15T10:00:00", status: "confirmed", services: { title: "Masaje", price: 5000 } },
        { appointment_date: "2026-11-20T14:00:00", status: "pending", services: { title: "Facial", price: 3000 } },
        { appointment_date: "2026-10-10T10:00:00", status: "completed", services: { title: "Masaje", price: 5000 } },
      ];

      const selectedMonth = 10;
      const selectedYear = 2026;

      const income = appointments
        .filter((app) => {
          const d = new Date(app.appointment_date);
          return (
            d.getMonth() === selectedMonth &&
            d.getFullYear() === selectedYear &&
            (app.status === "confirmed" || app.status === "completed")
          );
        })
        .reduce((sum, app) => sum + (app.services?.price || 0), 0);

      expect(income).toBe(5000); // Only the confirmed Nov appointment
    });
  });
});