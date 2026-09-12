---
name: portadora-supabase-split
description: >
  Six Supabase client variants and when to use each in portadora-eros.
  Trigger: when creating a Supabase client, choosing a client for a query, or touching RLS.
license: Apache-2.0
metadata:
  author: portadora-eros
  version: "1.0"
---

# Supabase Client Split — portadora-eros

Source: `src/lib/supabase/{client,server,readonly,service,admin,session}.ts` +
`openspec/specs/row-level-security` + `data-access-layer`.

The repo deliberately splits Supabase into SIX clients. Choosing the wrong one
either leaks PII past RLS or forces dynamic rendering. Pick by role, below.

## The six clients

| File | Import | Role | RLS? | Server-only? |
|---|---|---|---|---|
| `client.ts` | `createClient` @ `@/lib/supabase/client` | Browser anon/user | anon/`auth.uid()` | ❌ client |
| `server.ts` | `createClient` @ `@/lib/supabase/server` | Server, session-aware, cookie-backed | user session | ✅ |
| `readonly.ts` | `createReadClient` | Server, cookie-FREE anon read | anon | ✅ |
| `service.ts` | `createServiceClient` | Server, service-role (bypasses RLS) | ❌ bypass | ✅ |
| `admin.ts` | `createAdminClient` | Scoped service-role for `push_subscriptions` only | ❌ bypass | ✅ |
| `session.ts` | `updateSession` | Middleware session refresh (not a query client) | — | ✅ |

## MUST

- MUST use `@/lib/supabase/server` (`createClient`) for any query whose result
  depends on the **authenticated user**, and for all admin mutations.
- MUST use `createServiceClient` (service-role) to resolve **public availability**
  reads on `appointments`, since RLS now denies anon SELECT there. Select ONLY
  non-PII columns (`appointment_date`, `service_id`, `status`).
- MUST use `createAdminClient` ONLY to read `push_subscriptions` (endpoint/keys)
  for the public booking push broadcast. Never for anything else.
- MUST keep `service`/`admin` clients server-only. Never import them into a
  `'use client'` module or client component.

## SHOULD

- SHOULD use `createReadClient` (cookie-free) inside `unstable_cache` so caching
  does NOT force dynamic rendering — it goes through the anon role so RLS still
  applies. See `src/lib/api/settings.ts`.
- SHOULD select explicit non-PII columns when bypassing RLS; never `select('*')`
  on a PII table through the service client.

## NEVER

- Never use the service-role client to return `client_name`/`client_email`/
  `client_phone` to the browser.
- Never use `createReadClient` (anon) for a user-dependent query.
- Never import `admin`/`service` into a client bundle — it leaks the
  `SUPABASE_SERVICE_ROLE_KEY` path.

## Session refresh (session.ts)

Middleware: keep NO logic between `createServerClient(...)` and
`supabase.auth.getUser()`. Never build a new `NextResponse` without copying
`supabaseResponse.cookies.getAll()`, or you desync the session and log the user out.

## Examples

### ✅ Availability (public, RLS-denied read) — service role, non-PII only

```typescript
const svc = createServiceClient();
const { data, error } = await svc
  .from('appointments')
  .select('appointment_date, service_id, services:service_id(duration)')
  .gte('appointment_date', today.toISOString())
  .lte('appointment_date', `${windowEnd}T23:59:59Z`)
  .neq('status', 'cancelled');
```

### ✅ Admin mutation — session-aware client

```typescript
const supabase = await createClient(); // '@/lib/supabase/server'
await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', appointmentId);
```

### ✅ Cache-safe public read

```typescript
const supabase = createReadClient(); // cookie-free → safe inside unstable_cache
const { data } = await supabase.from('admin_settings').select('*').eq('id', 1).single();
```

### ❌ Wrong — service role selecting PII

```typescript
const svc = createServiceClient();
const { data } = await svc.from('clients').select('*'); // leaks PII past RLS — NEVER
```