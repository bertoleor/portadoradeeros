---
name: portadora-context
description: >
  Domain context for the portadora-eros codebase (agenda virtual + public site +
  notification automations). Trigger: before writing or reviewing any code in this repo.
license: Apache-2.0
metadata:
  author: portadora-eros
  version: "1.0"
---

# Portadora Eros — Domain Context

Load this skill FIRST before touching any code in this repo. It anchors every
other `portadora-*` skill to the real architecture, stack, and conventions.

## What this app is

- **Public site** (alto tráfico): landing, services, and a **public booking form**
  that lets visitors request a turno without an account.
- **Admin virtual agenda**: `/admin` routes for managing appointments, clients,
  blocked times, contact messages, services, and settings.
- **Notification automations**: EmailJS (email) + web-push (VAPID) fired on booking
  and admin actions.

## Stack (authoritative from package.json / tsconfig)

- **Next 16** (`next@16.1.6`), App Router, React 19, TypeScript `strict: true`
  **without** `noUncheckedIndexedAccess`.
- **Supabase** via `@supabase/ssr` + `@supabase/supabase-js`; `Database` types in
  `src/types/database` generated from migrations (never hand-edited).
- **zod 4** (`zod@4.3.6`) for input validation (`z.email`, `z.coerce.number`).
- **Tiptap 3** (`@tiptap/*@3.20.1`) for the rich-text editor.
- **EmailJS** (`@emailjs/nodejs`) + **web-push** for notifications.
- **Vitest** (`vitest run`) — currently a single smoke test `src/lib/api/error.test.ts`.
- **sanitize-html** for untrusted rich text. **date-fns**, **react-hook-form** +
  `@hookform/resolvers`, **shadcn**, **tailwind 4**.

## Directory map (MUST know before editing)

| Path | Role |
|---|---|
| `src/lib/supabase/*.ts` | 6 client variants — see `portadora-supabase-split` |
| `src/lib/api/*.ts` | Server actions / data layer — see `portadora-error-contract` |
| `src/lib/api/error.ts` | `AppError` + `Result<T>` contract |
| `src/lib/api/mappers.ts` | snake_case → camelCase DB-to-domain mappers |
| `src/lib/auth/requireAdmin.ts` | server authorization guard (allowlist) |
| `src/lib/email.ts` | EmailJS wrappers |
| `src/lib/logger.ts` | dev-only logger |
| `src/app/api/*/route.ts` | public route handlers (`appointments`, `contact`, `admin/push/subscribe`) |
| `src/components/ui/RichTextEditor.tsx` | Tiptap editor (shared) |
| `openspec/specs/*/spec.md` | source-of-truth specs (GIVEN/WHEN/THEN) |
| `supabase_schema.sql`, `migrations/` | DB schema (migrations are single source of truth) |

## The six specs (audit findings → fixed conventions)

1. `auth-hardening` — signup closed (`disable_signup=true`), admin allowlist via `is_admin()`.
2. `booking-validation` — zod on public endpoints, session guard + defense-in-depth, force `status='pending'`.
3. `data-access-layer` — indexed lookups (no full-scan), range queries (no 30-day loops), RSC cache + revalidation, single throw error contract.
4. `row-level-security` — RLS on `clients`/`appointments`/`blocked_times`; anon denied on PII; `blocked_times` public-read by design.
5. `observability` — `error.tsx`/`global-error.tsx`, `loading.tsx` in admin, unified throw contract, ESLint clean, test runner.
6. `schema-consolidation` — migrations are single source of truth, `messages`/`settings` exist, `appointment_date` indexed, `email` unique.

## Naming conventions (binding)

- **DB columns are snake_case** (`client_name`, `appointment_date`, `is_visible`).
- **Domain/JS shapes are camelCase** (`clientName`, `appointmentDate`, `isVisible`).
- Mappers live ONLY in `src/lib/api/mappers.ts` and reuse `snakeToCamel` (C3).
- `@/*` path alias → `./src/*`. Always import via `@/...`, never relative `../../`.

## MUST rules

- Read the relevant spec (GIVEN/WHEN/THEN) before implementing a change it covers.
- Source-of-truth for schema is `migrations/`, never hand-edit `Database` types.
- Spanish UI copy uses **voseo** (see the `i18n-es-ar` skill).
- Server-only Supabase clients (service/admin) MUST NOT be imported into client components.

## NEVER

- Never hand-write `Database` types — regenerate from migrations.
- Never re-implement snake→camel mapping; use `mappers.ts`.
- Never import `@/lib/supabase/admin` or `service` into `'use client'` modules.
- Never trust client-sent `status` on a public booking insert.