# EROS — STATUS

> Estado del proyecto y dónde vive cada fuente de verdad. Solo documentación. Actualizado:
> 2026-09-15 · Rama: `feat/rls-phase10` · Verificado contra `src/`, `package.json`,
> `supabase_schema.sql`.

## Stack (resumen rápido)

**Next.js 16 (App Router) + React 19 + TypeScript strict · Tailwind CSS v4 · Supabase
(DB/Auth/Storage) · shadcn + Base UI · Zod 4 + react-hook-form · Vercel deploy como PWA · reserva
sin gateway (pago manual, sin PCI).** Detalle completo y versionado → [`03-stack.md`](03-stack.md).

## Fuentes de verdad (canónicas)

| Área                               | Doc canónico                                       |
| ---------------------------------- | -------------------------------------------------- |
| Producto, catálogo, actores, rutas | [`01-producto.md`](01-producto.md)                 |
| Setup local, DB, deploy            | [`02-como-se-arma.md`](02-como-se-arma.md)         |
| Stack y tooling                    | [`03-stack.md`](03-stack.md)                       |
| Marca, voz, SEO, activos           | [`04-branding.md`](04-branding.md)                 |
| Identidad visual                   | [`05-identidad-visual.md`](05-identidad-visual.md) |
| Marketing                          | [`06-marketing.md`](06-marketing.md)               |
| Decisiones (ADR)                   | [`adr/`](adr/)                                     |
| Índice completo                    | [`README.md`](README.md)                           |

Análisis profundos (riesgos, gaps, precommit, tests) viven en `reports/` y `plans/` — no se duplican
en `docs/`.

## Deuda documental abierta (NO tocada — ticket aparte)

- `AUDITORIA_*.md`, `PLAN_*.md`, `MEJORAS_*.md`, `PROPUESTAS_*.md` sueltos en la raíz del repo
  (históricos). Consolidar a `docs/` requiere ok (EROS-C3) — pendiente.

## Regla de mantenimiento

Editar la fuente de verdad una sola vez (el `.md` canónico). Si aparece el mismo dato duplicado en
otro `.md`, mover la referencia (no copiar contenido) hacia `docs/`.
