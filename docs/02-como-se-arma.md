# EROS — Cómo se arma (build, run, deploy)

> Fuente: `package.json`, `next.config.ts`, `vercel.json`, `supabase_schema.sql`, `migrations/*`,
> `src/proxy.ts`. Verificado 2026-09-15. Solo docs, no toca código.

## Requisitos

- Node 20+ · `pnpm` (hay `pnpm-lock.yaml` + `pnpm-workspace.yaml`) o npm.
- Proyecto Supabase + claves `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (solo server, acotada a push).
- EmailJS/Resend según `src/lib/email*` + clave `web-push` (VAPID) para notificaciones admin.

## Setup local

```bash
pnpm install
# .env.local con las claves Supabase + email + push + NEXT_PUBLIC_APP_URL
pnpm dev        # http://localhost:3000
```

## Esquema DB (orden de aplicación)

1. `supabase_schema.sql` — tablas `services`, `appointments`, `admin_settings` + RLS + bucket
   `public-images`.
2. `supabase_seed.sql` — 4 servicios iniciales.
3. `migrations/*` — canónica `0001_canonical_schema.sql`, `blocked_times`, `contact_messages`,
   `push_subscriptions`, `clients`, `service_images`, RLS allowlist, `business_hours` (phase10).
4. Crear usuario admin manual en Supabase Auth (signup público deshabilitado) + insertar UID en
   `public.admin_users` (ver ADR-0001).

## Comandos

| Comando                           | Qué hace                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev` / `build` / `start`    | Next 16 dev / build prod / serve                                                                                           |
| `pnpm typecheck` (`tsc --noEmit`) | ✅ PASS verificado 2026-09-12                                                                                              |
| `pnpm lint` (`eslint .`)          | Lint                                                                                                                       |
| `pnpm test` (`vitest run`)        | Tests unitarios                                                                                                            |
| `pnpm test:e2e`                   | Playwright                                                                                                                 |
| `pnpm format:check`               | ⚠️ roto por `tailwindConfig` inexistente en `.prettierrc.json` (ver `reports/project-analysis/eros-baseline-precommit.md`) |

## Deploy (Vercel)

- `vercel.json`: cron diario `0 12 * * *` → `/api/cron/reminders`.
- Env vars en Vercel: las mismas del `.env.local` +
  `NEXT_PUBLIC_APP_URL=https://portadoradeeros.com`.
- Auth admin: gate doble — `src/proxy.ts` (renueva sesión, redirige `/admin` sin user) +
  `requireAdmin()` (`getUser()` + RPC `is_admin()`).
- RLS: lectura pública solo `services` visibles + `admin_settings`; `appointments` INSERT público
  (`WITH CHECK (true)`), resto solo `authenticated` + `is_admin()`.

## Estructura `src/`

- `app/(main)` — páginas públicas; `app/admin` — panel; `app/api` — `appointments`, `contact`,
  `admin/push/subscribe`, `cron/reminders`.
- `components/client` — Hero, carruseles, formularios, Navbar, Footer, Shell, BackgroundMesh.
- `components/admin` + `components/ui` (shadcn) + `components/pwa`.
- `lib/api` — `appointments`, `services`, `settings`, `blocked-times`, `storage`;
  `lib/auth/requireAdmin`; `lib/sanitize`; `lib/email*`.
