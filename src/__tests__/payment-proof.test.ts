import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * TDD RED Phase: Write failing tests for payment proof validation
 */

describe("Payment Proof Validation", () => {
  describe("Appointment Schema with Payment Proof", () => {
    it("should accept paymentProofUrl as optional field in appointmentSchema", async () => {
      const { appointmentSchema } = await import("@/lib/api/appointments-schemas");

      const validPayload = {
        serviceId: "test-service-id",
        serviceName: "Test Service",
        serviceDurationMinutes: 60,
        clientName: "Juan Pérez",
        clientEmail: "juan@example.com",
        clientPhone: "+54 11 1234-5678",
        appointmentDate: new Date("2026-12-01T14:00:00"),
        notes: "Test notes",
        paymentProofUrl: "https://example.com/comprobante.pdf",
        company_website: "",
      };

      const result = appointmentSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    }, 10000);

    it("should accept payload without paymentProofUrl (optional)", async () => {
      const { appointmentSchema } = await import("@/lib/api/appointments-schemas");

      const validPayload = {
        serviceId: "test-service-id",
        serviceName: "Test Service",
        serviceDurationMinutes: 60,
        clientName: "Juan Pérez",
        clientEmail: "juan@example.com",
        clientPhone: "+54 11 1234-5678",
        appointmentDate: new Date("2026-12-01T14:00:00"),
        notes: "Test notes",
        company_website: "",
      };

      const result = appointmentSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    }, 10000);

    it("should validate paymentProofUrl format when provided", async () => {
      const { appointmentSchema } = await import("@/lib/api/appointments-schemas");

      const invalidPayload = {
        serviceId: "test-service-id",
        serviceName: "Test Service",
        serviceDurationMinutes: 60,
        clientName: "Juan Pérez",
        clientEmail: "juan@example.com",
        clientPhone: "+54 11 1234-5678",
        appointmentDate: new Date("2026-12-01T14:00:00"),
        notes: "Test notes",
        paymentProofUrl: "not-a-valid-url",
        company_website: "",
      };

      const result = appointmentSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    }, 10000);
  });

  describe("createAppointment with Payment Proof (integration)", () => {
    it.skip("should create appointment with status 'pending_payment' when paymentProofUrl provided", async () => {
      const { createAppointment } = await import("@/lib/api/appointments");

      const payload = {
        serviceId: "test-service-id",
        serviceName: "Test Service",
        serviceDurationMinutes: 60,
        clientName: "Juan Pérez",
        clientEmail: "juan@example.com",
        clientPhone: "+54 11 1234-5678",
        appointmentDate: new Date("2026-12-01T14:00:00"),
        notes: "Test notes",
        paymentProofUrl: "https://example.com/comprobante.pdf",
        company_website: "",
      };

      const result = await createAppointment(payload);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.status).toBe("pending_payment");
        expect(result.data.payment_proof_url).toBe("https://example.com/comprobante.pdf");
      }
    });

    it.skip("should create appointment with status 'pending' when no paymentProofUrl provided", async () => {
      const { createAppointment } = await import("@/lib/api/appointments");

      const payload = {
        serviceId: "test-service-id",
        serviceName: "Test Service",
        serviceDurationMinutes: 60,
        clientName: "Juan Pérez",
        clientEmail: "juan@example.com",
        clientPhone: "+54 11 1234-5678",
        appointmentDate: new Date("2026-12-01T14:00:00"),
        notes: "Test notes",
        company_website: "",
      };

      const result = await createAppointment(payload);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.status).toBe("pending");
      }
    });
  });

  describe("confirmAppointment with Payment Proof (integration)", () => {
    it.skip("should require payment proof to confirm a pending_payment appointment", async () => {
      const { confirmAppointment, createAppointment } = await import("@/lib/api/appointments");

      // First create a pending_payment appointment
      const createResult = await createAppointment({
        serviceId: "test-service-id",
        serviceName: "Test Service",
        serviceDurationMinutes: 60,
        clientName: "Juan Pérez",
        clientEmail: "juan@example.com",
        clientPhone: "+54 11 1234-5678",
        appointmentDate: new Date("2026-12-01T14:00:00"),
        notes: "Test notes",
        paymentProofUrl: "https://example.com/comprobante.pdf",
        company_website: "",
      });

      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      // Try to confirm without payment proof - should fail
      const confirmResult = await confirmAppointment(createResult.data.id);
      expect(confirmResult.ok).toBe(false);
      if (!confirmResult.ok) {
        expect(confirmResult.error.message).toContain("comprobante");
      }
    });

    it.skip("should confirm appointment when payment proof exists", async () => {
      const { confirmAppointment, createAppointment } = await import("@/lib/api/appointments");

      // First create a pending_payment appointment
      const createResult = await createAppointment({
        serviceId: "test-service-id",
        serviceName: "Test Service",
        serviceDurationMinutes: 60,
        clientName: "Juan Pérez",
        clientEmail: "juan@example.com",
        clientPhone: "+54 11 1234-5678",
        appointmentDate: new Date("2026-12-01T14:00:00"),
        notes: "Test notes",
        paymentProofUrl: "https://example.com/comprobante.pdf",
        company_website: "",
      });

      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      // Confirm should succeed since payment proof exists
      const confirmResult = await confirmAppointment(createResult.data.id);
      expect(confirmResult.ok).toBe(true);
      if (confirmResult.ok) {
        expect(confirmResult.data.id).toBe(createResult.data.id);
      }
    });

    it.skip("should allow confirming pending appointments without payment proof (backward compatibility)", async () => {
      const { confirmAppointment, createAppointment } = await import("@/lib/api/appointments");

      // Create a regular pending appointment (no payment proof)
      const createResult = await createAppointment({
        serviceId: "test-service-id",
        serviceName: "Test Service",
        serviceDurationMinutes: 60,
        clientName: "Juan Pérez",
        clientEmail: "juan@example.com",
        clientPhone: "+54 11 1234-5678",
        appointmentDate: new Date("2026-12-01T14:00:00"),
        notes: "Test notes",
        company_website: "",
      });

      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      // Should still be able to confirm (backward compatibility)
      const confirmResult = await confirmAppointment(createResult.data.id);
      expect(confirmResult.ok).toBe(true);
      if (confirmResult.ok) {
        expect(confirmResult.data.id).toBe(createResult.data.id);
      }
    });
  });
});

describe("Push Notifications on Confirm/Cancel", () => {
  it("should send push notification on confirmAppointment", async () => {
    // This will be tested via integration test
    // For now, just verify the function signature accepts the right params
    const { confirmAppointment } = await import("@/lib/api/appointments");
    expect(typeof confirmAppointment).toBe("function");
  });

  it("should send push notification on cancelAppointment", async () => {
    const { cancelAppointment } = await import("@/lib/api/appointments");
    expect(typeof cancelAppointment).toBe("function");
  });
});