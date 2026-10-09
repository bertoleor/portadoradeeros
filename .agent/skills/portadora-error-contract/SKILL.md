---
name: portadora-error-contract
description: >
  AppError + Result<T> throw contract for the portadora-eros API layer. Trigger: when writing server
  actions, route handlers, or error handling in this repo.
license: Apache-2.0
metadata:
  author: portadora-eros
  version: '1.0'
---

# Error Contract — portadora-eros

Source: `openspec/specs/data-access-layer/spec.md` (C4) + `observability/spec.md`, implemented in
`src/lib/api/error.ts`.

## The contract

The API layer emits errors via **throw + error boundary**, NOT via mixed `{ success, error }`
returns and NOT silent `[]` / `{}` fail-open returns.

```typescript
// src/lib/api/error.ts — the ONLY error vocabulary
export type ErrorCode = 'UNAUTHORIZED' | 'VALIDATION' | 'DB' | 'NOT_FOUND';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    msg: string
  ) {
    super(msg);
    this.name = 'AppError';
  }
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };
export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}
export function fail<T>(error: AppError): Result<T> {
  return { ok: false, error };
}
```

## The four codes and their meaning

- `UNAUTHORIZED` — caller anonymous or not in the admin allowlist (requireAdmin).
- `VALIDATION` — business-rule rejection (e.g. slot collision), not malformed input shape.
- `DB` — any Supabase query/insert/update error.
- `NOT_FOUND` — looked-up row missing (e.g. appointment to confirm/cancel).

## MUST

- MUST `throw new AppError(code, userFacingMessage)` for any real failure in a server action or
  data-layer function. Never return a bare `[]` or `null` to represent "it failed".
- MUST use `AppError`, never a plain `Error`, for domain/recoverable failures.
- MUST give the message in Spanish (es-AR, voseo where it addresses the user).
- MUST use `requireAdmin()` (which throws `AppError('UNAUTHORIZED')`) at the top of every mutating
  admin action — defense-in-depth beyond RLS.

## SHOULD

- SHOULD return `Result<T>` (via `ok()`/`fail()`) for operations the caller needs to branch on
  without a boundary — e.g. `createAppointment` returns `Result<AppointmentRow>`.
- SHOULD rethrow DB errors as `AppError('DB', ...)` rather than swallowing, so the boundary can
  surface them. Prefer `throw` over `fail()` for genuinely exceptional paths.
- SHOULD keep `requireAdmin` the sole source of the auth gate so authorization cannot drift from the
  DB's `is_admin()` predicate.

## NEVER

- Never return `{ success: false, error }` — that is the old mixed contract.
- Never `return []` / `return null` to mask a query error (`getAppointments` and `getClients`
  currently still do this; do NOT copy that when writing new code).
- Never `console.error`-only and swallow a DB failure on a mutating action.

## Examples

### ✅ Correct (server action)

```typescript
export async function confirmAppointment(id: string): Promise<Result<{ id: string }>> {
  await requireAdmin(); // throws AppError('UNAUTHORIZED') if not allowed
  const { data, error } = await supabase.from('appointments').select('*').eq('id', id).single();
  if (error || !data) throw new AppError('NOT_FOUND', 'No se pudo obtener el turno.');
  const { error: upErr } = await supabase
    .from('appointments')
    .update({ status: 'confirmed' })
    .eq('id', id);
  if (upErr) throw new AppError('DB', 'Ocurrió un error al actualizar el estado.');
  return ok({ id });
}
```

### ✅ Correct (business validation)

```typescript
if (!availability.available) {
  throw new AppError(
    'VALIDATION',
    'Ese horario se superpone con otro turno. Por favor elegí otro horario.'
  );
}
```

### ❌ Wrong (fail-open)

```typescript
if (error) {
  console.error(error);
  return [];
} // masks the failure — do NOT copy
```
