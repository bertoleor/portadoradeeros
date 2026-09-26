# portadora-eros

Sitio web de servicios esotéricos (reserva de turnos + panel admin). PWA sobre
Vercel. Docs canónicas → [`docs/`](docs/README.md).

## Stack

Next.js 16 (App Router) + React 19 + TypeScript strict · Tailwind CSS v4 ·
Supabase (DB/Auth/Storage) · shadcn + Base UI · Zod 4 + react-hook-form.
Detalle → [`docs/03-stack.md`](docs/03-stack.md).

## Setup local

Requisitos: Node 20+, `pnpm` (hay `pnpm-lock.yaml` + `pnpm-workspace.yaml`) o npm.

```bash
pnpm install
# .env.local con las claves Supabase + email + push + NEXT_PUBLIC_APP_URL
pnpm dev        # http://localhost:3000
```

Proyecto Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` (solo server). Email/resend según `src/lib/email*` +
clave `web-push` (VAPID) para notificaciones admin.

## Docs

| Doc | Contenido |
| --- | --------- |
| [`docs/README.md`](docs/README.md) | Índice completo |
| [`docs/01-producto.md`](docs/01-producto.md) | Qué es, catálogo, actores, rutas |
| [`docs/02-como-se-arma.md`](docs/02-como-se-arma.md) | Setup, DB/migraciones, deploy, estructura `src/` |
| [`docs/03-stack.md`](docs/03-stack.md) | Framework, backend, plataforma, tooling |
| [`docs/04-branding.md`](docs/04-branding.md) | Marca, voz, SEO, activos |
| [`docs/05-identidad-visual.md`](docs/05-identidad-visual.md) | Paleta, tipografías, botones |
| [`docs/06-marketing.md`](docs/06-marketing.md) | Propuesta, embudo, canales |
| [`CHANGELOG.md`](CHANGELOG.md) | Cambios del repo |
| [`docs/adr/`](docs/adr/) | Decisiones (ADR-0001 allowlist `is_admin()`) |
| [`docs/STATUS.md`](docs/STATUS.md) | Estado del proyecto + fuentes de verdad |

## Comandos

| Comando | Qué hace |
| ------- | -------- |
| `pnpm dev` / `build` / `start` | Next 16 dev / build prod / serve |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | `eslint .` |
| `pnpm test` | Tests unitarios (vitest) |
| `pnpm test:e2e` | Playwright |

Deploy Vercel: `vercel.json` (cron diario `/api/cron/reminders`) + env vars del
`.env.local` + `NEXT_PUBLIC_APP_URL=https://portadoradeeros.com`.
Auth admin: gate doble — `src/proxy.ts` + `requireAdmin()` (`is_admin()`, ADR-0001).
