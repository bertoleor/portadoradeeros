### E2E Tests: Booking Happy Path (public wizard)

**Suite ID:** `BOOKING-E2E` **Feature:** Public appointment booking — the production-critical path
(P0 focus: booking first).

---

## Test Case: `BOOKING-E2E-001` — Visitor books a tarot session end to end

**Priority:** `critical`

**Tags:**

- type → @e2e
- feature → @booking

**Description/Objective:** Verify a first-time visitor can complete the whole public booking wizard
(intro → client info → calendar → time picker → confirm) and reach the success state, with the
server action persisting the appointment.

**Preconditions:**

- Next dev server running (started by Playwright `webServer`)
- Supabase REST stub active (route-level, `tests/e2e/fixtures/supabase-stub.ts`): services seeded
  (tarot/buzios), settings open every day 09–18, zero appointments/blocked times
- No real email/push: `EMAIL_PROVIDER=smtp` without SMTP host fails silently inside the flow's
  try/catch; stub has no push subscriptions

### Flow Steps:

1. Open `/servicios/tarot` and click "Comenzar Reserva"
2. Fill Nombre/Apellido/Email/WhatsApp and continue
3. Pick the first enabled day in the calendar and continue
4. Pick hour 10 + minute 00 and continue
5. Check the legal-terms checkbox and click "Confirmar Turno"

### Expected Result:

- Success screen shows heading "Turno Solicitado"
- The server action created an appointment row via the Supabase stub (status pending)

### Key verification points:

- `expect(booking.successHeading).toBeVisible()` after submit
- Stub received the POST (fixtures assert in `createdAppointments`)

### Notes:

- Covers the CI gap flagged by F0-2026-09-27 §6: the `e2e` CI job ran `playwright test` with no
  config or specs, so a broken booking flow would go unnoticed.
- Why dev server, not build: production build takes ~26 min (impractical in the 30-min CI job); the
  happy path touches only 3 routes.
