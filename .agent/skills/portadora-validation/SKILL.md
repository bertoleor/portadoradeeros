---
name: portadora-validation
description: >
  zod 4 validation conventions for portadora-eros public endpoints and forms. Trigger: when
  validating request payloads or defining form schemas in this repo.
license: Apache-2.0
metadata:
  author: portadora-eros
  version: '1.0'
---

# Validation (zod 4) — portadora-eros

Source: `src/app/api/{appointments,contact}/route.ts` + `openspec/specs/booking-validation/spec.md`
(validation zod, S7). Stack: `zod@4.3.6`.

## MUST

- MUST validate every public endpoint payload (`contact`, `appointments`) with a zod schema via
  `.safeParse(body)` BEFORE any processing; reject with HTTP 400 and NO side effects on failure.
- MUST use zod 4 APIs: `z.email()` for email, `z.coerce.number()` for numeric fields arriving as
  strings (e.g. `price`), NOT `z.string().email()`.
- MUST define the schema at module top level (outside the handler) as a named `const`, so it is
  shared with the form layer and testable.
- MUST return the zod error surface as a generic user message (the client never gets raw zod issues
  exposed).

## SHOULD

- SHOULD use `.default('')` / `.optional()` for fields the payload may omit, so the parsed output is
  always well-formed.
- SHOULD pair React Hook Form (`react-hook-form` + `@hookform/resolvers`) with a shared zod schema
  via `zodResolver` for forms, so client and server validate identically.

## NEVER

- Never `z.string().email()` — this is zod v3; the repo is on zod 4 (`z.email()`).
- Never coerce number via `Number(...)` in the handler when `z.coerce.number()` expresses intent at
  the boundary.
- Never process a payload that failed `safeParse` — return 400 and stop.
- Never trust a raw `JSON.stringify` of the body without schema validation.

## Real schemas in the repo

```typescript
// src/app/api/appointments/route.ts (zod 4)
const appointmentSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  surname: z.string().min(1, 'Apellido requerido'),
  email: z.email('Email inválido'), // zod 4, not z.string().email()
  phone: z.string().min(1, 'Teléfono requerido'),
  service: z.string().min(1, 'Servicio requerido'),
  date: z.string().min(1, 'Fecha requerida'),
  time: z.string().min(1, 'Hora requerida'),
  price: z.coerce.number(), // string → number
  bankDetails: z
    .object({
      bankName: z.string().default(''),
      accountType: z.string().default(''),
      accountNumber: z.string().default(''),
      cbu: z.string().default(''),
      alias: z.string().default(''),
    })
    .optional(),
});

// src/app/api/contact/route.ts
const contactSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  email: z.email('Email inválido'),
  message: z.string().min(1, 'Mensaje requerido'),
  phone: z.string().optional(),
});
```

## Handler pattern (MUST follow)

```typescript
const parsed = appointmentSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
}
const { name, email, ... } = parsed.data;
```

Use `parsed.data` (the validated/coerced shape) for all downstream work — never the raw `body`.
