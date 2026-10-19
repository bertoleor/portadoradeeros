# EROS — Code Review Rules (GGA)

Stack: Next 16.1 / React 19 / TS strict / Tailwind v4 / Supabase / zod 4. Canon:
`E:/Hermes/AGENTS.md` (Gentleman gates rigen en este repo).

## General

REJECT if:

- Hardcoded secrets or credentials
- `any` type or missing types on exported functions
- Empty catch blocks
- `console.log` in production code (use logger)

## Frontend

REJECT if:

- `style=` inline or hardcoded hex in className (use Tailwind + `cn()`)
- `!important` in CSS

## Pagos y reservas

REJECT if:

- Card or personal data logged
- Webhook without signature verification
- Booking path without idempotency key
- sitemap/robots domain differs from canonical layout domain

## Response Format

FIRST LINE must be exactly: STATUS: PASSED or STATUS: FAILED

If FAILED, list: `file:line - rule violated - issue`

## Docs del proyecto — rutas canónicas (set infaltables v2)

> Convención de flota: `E:/Hermes/docs/sistema/docs-infaltables-proyectos.md` — raíz = lo que las
> herramientas consumen; `docs/` = biblioteca con nombre fijo.

- **Raíz:** `README.md` · `AGENTS.md` · `SECURITY.md` · `CONTRIBUTING.md` · `CHANGELOG.md` ·
  `ARCHITECTURE.md` · `LICENSE`
- **`docs/`:** `docs/DESIGN.md` · `docs/API.md` · `docs/DATABASE.md` · `docs/marca.md` ·
  `docs/plan-accion-YYYY-MM-DD.md` · `docs/runbooks/`

Pendientes en este proyecto (audit 19-writer 2026-10-19): `LICENSE` (ORN-219) ·
`docs/plan-accion-*.md` (ORN-218) · `docs/runbooks/` (ORN-217)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your
training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's
directory; in monorepos the `next` package may not be visible from the repo root) before writing any
code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at
`node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates
the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
