# Booking Canonical Path Specification

## Purpose

Exactly one booking path exists: the `createAppointment()` server action.

## Requirements

### Requirement: Single Booking Path

The system MUST expose booking creation only through the `createAppointment()` server action in
`src/lib/api/appointments.ts`. No `POST /api/appointments` route SHALL exist.

#### Scenario: Orphan route absent

- GIVEN the App Router tree under `src/app/api`
- WHEN listed for an `appointments` route handler
- THEN no `src/app/api/appointments/route.ts` exists

#### Scenario: Form uses canonical action

- GIVEN `ServiceContactForm`
- WHEN a booking is submitted
- THEN it calls `createAppointment()` and persists via the server action

### Requirement: Contact Route Untouched

The system MUST keep `POST /api/contact` operational (live caller: `contacto/page.tsx`).

#### Scenario: Contact still wired

- GIVEN `contacto/page.tsx`
- WHEN the form is submitted
- THEN `fetch('/api/contact', …)` succeeds as before
