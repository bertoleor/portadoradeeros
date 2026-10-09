---
name: portadora-booking
description: >
  Booking/appointment data-layer rules for portadora-eros (status machine, availability, collision,
  clients). Trigger: when writing appointment or client logic.
license: Apache-2.0
metadata:
  author: portadora-eros
  version: '1.0'
---

# Booking & Appointments — portadora-eros

Source: `src/lib/api/appointments.ts` +
`openspec/specs/{booking-validation,data-access-layer,row-level-security,row-level}`.

## Status machine

Allowed `appointments.status` values: `'pending' | 'confirmed' | 'completed' | 'cancelled'`.

- Public/anon booking inserts → **always `'pending'`**, forced server-side.
- Admin-created appointment → `'confirmed'` directly (already paid/confirmed).
- Mutations: `confirmAppointment` (`pending→confirmed`), `completeAppointment` (`→completed`),
  `cancelAppointment` (`→cancelled`).

## MUST

- MUST force `status: 'pending'` on any public/anonymous insert, ignoring whatever the client sent
  (booking-validation S6, row-level-security).
- MUST gate every mutating appointment/client action behind `requireAdmin()`.
- MUST fail closed on availability: a query error MUST report the slot as **unavailable**
  (`available: false`), never as free.
- MUST check `checkSlotAvailability` before an admin creates an appointment and throw
  `AppError('VALIDATION', ...)` on collision.
- MUST normalize phone via `normalizePhone()` (digits + leading `+`) before any lookup or write, and
  lowercase emails, so `.eq()` lookups are robust.

## Should

- SHOULD resolve availability with range queries on `appointment_date` (indexed), selecting only
  non-PII columns through `createServiceClient` — never iterate 30 days with per-day queries (N+1,
  P2/P5).
- SHOULD look up clients with indexed `.eq('email', ...)` / `.eq('phone', ...)`
  - `.maybeSingle()`, not "load all and filter" (P1). Email first, then phone.

## NEVER

- Never trust a client-sent `status` or `client_id` on a public insert.
- Never run per-day SQL in a loop to compute availability.
- Never filter the whole `clients`/`appointments` table in JS for a single lookup.
- Never return `{ available: true }` when the availability query errored.

## Key functions (src/lib/api/appointments.ts)

- `createAppointment(payload)` — public booking → `pending`, sends emails + push, returns `Result`.
- `createAppointmentAdmin(payload)` — admin, skips payment, `confirmed`, collision-checked.
- `checkSlotAvailability(proposedStart, durationMin, excludeId?)` — fail-closed overlap check.
- `getBookedSlots(dateStr, durationMin)` — occupied `HH:MM` slots for a date.
- `getNextAvailableSlots(businessHours, durationMin, count)` — one 30-day window, range queries for
  appointments + `blocked_times`, walk business-hours in memory.
- `findClient(phone?, email?)` / `findOrCreateClient(data)` / `updateClient(...)`.
- `getBlockedTimesForDate(dateStr)` — public `blocked_times` read (by design).

## Examples

### ✅ Force pending + normalize (public)

```typescript
const { data: dbData, error: dbError } = await supabase
  .from('appointments')
  .insert([
    {
      service_id,
      client_name,
      client_email,
      client_phone: clientPhone || null,
      appointment_date: appointmentDate.toISOString(),
      status: 'pending', // overridden server-side, never from client
    },
  ])
  .select()
  .single();
if (dbError) return fail(new AppError('DB', 'Hubo un error al registrar el turno.'));
```

### ✅ Fail-closed availability

```typescript
const { data, error } = await query; // range query, non-PII columns
if (error) return { available: false }; // NEVER report free on error
```

### ✅ Indexed findClient

```typescript
const { data, error } = await supabase
  .from('clients')
  .select('*')
  .eq('email', email.toLowerCase())
  .maybeSingle();
if (error) throw new AppError('DB', `Failed to look up client by email: ${error.message}`);
```
