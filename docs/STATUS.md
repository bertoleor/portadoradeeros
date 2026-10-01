# EROS — STATUS

> **Búsqueda:** keywords: `eros, status, fuentes de verdad, consolidacion docs, rama` ·
> clasificación: `status` · estado: `canónico` · actualizado: 2026-09-30 Relacionados:
> [[projects/eros/README|README]] · [[projects/eros/CHANGELOG|CHANGELOG]] · [[F0-2026-09-27]] ·
> [[docs/proyectos/eros|eros]]

> Estado del proyecto y dónde vive cada fuente de verdad. Solo documentación. Actualizado:
> 2026-09-30 · Rama: `feat/eros-deps` (HEAD 8827e8a) · Verificado contra `src/`, `package.json`,
> `migrations/` (schema canónico: `0001_canonical_schema.sql` +
> `migration_security_rls_allowlist.sql`
>
> - `add_rls_phase10.sql`, linaje en `migrations/README.md`), `supabase_seed.sql` y
>   `docs/F0-2026-09-27.md`.

## Stack (resumen rápido)

**Next.js 16 (App Router) + React 19 + TypeScript strict · Tailwind CSS v4 · Supabase
(DB/Auth/Storage) · shadcn + Base UI · Zod 4 + react-hook-form · Vercel deploy como PWA · reserva
sin gateway (pago manual, sin PCI).** Detalle completo y versionado → [`03-stack.md`](03-stack.md).

## Fuentes de verdad (canónicas)

| Área                               | Doc canónico                                       |
| ---------------------------------- | -------------------------------------------------- |
| Producto, catálogo, actores, rutas | [`01-producto.md`](01-producto.md)                 |
| Setup local, DB, deploy            | [`02-como-se-arma.md`](02-como-se-arma.md)         |
| Marca, voz, SEO, activos           | [`04-branding.md`](04-branding.md)                 |
| Identidad visual                   | [`05-identidad-visual.md`](05-identidad-visual.md) |
| Marketing                          | [`06-marketing.md`](06-marketing.md)               |
| Stack y tooling                    | [`03-stack.md`](03-stack.md)                       |
| Seguridad (medidas verificadas)    | [`SECURITY.md`](SECURITY.md)                       |
| Decisiones (ADR)                   | [`adr/`](adr/)                                     |
| Cambios del repo                   | [`../CHANGELOG.md`](../CHANGELOG.md) (raíz, P17)   |
| Índice completo                    | [`README.md`](README.md)                           |

Histórico preservado (referencia, no canónico): `audits/` (5 auditorías legacy), `plans/`
(planes/propuestas legacy + PRD), `auditoria-admin.md`, `auditoria-responsive-mobile.md`,
`eros-reporte-producto-marketing-estilo-2026-09-12.md` y `F0-2026-09-27.md` (inventario de
arranque). Análisis profundos (riesgos, gaps, precommit, tests) viven en `reports/` — no se duplican
en `docs/`.

## Consolidación de docs (EROS-C3) — CERRADO

- **2026-09-25** (commit 6e58833): 14 `.md` legacy de raíz → `docs/audits/` + `docs/plans/` (plan
  previo: `reports/EROS-C3-consolidacion-plan-2026-09-16.md`).
- **2026-09-30** (este refresh): 6 planes de `plans/` de raíz + `docs/MEJORAS_ADICIONALES.md` →
  `docs/plans/`; directorios `plans/` y `portadora-eros/` (vacíos, 0 archivos) retirados vía trash
  auditado (`E:/Hermes/scripts/trash.py`, agente 19); STATUS / README / SECURITY / 01-producto
  revalidados contra el código.
- **Resultado:** la raíz del repo queda solo con `README.md`, `AGENTS.md`, `CHANGELOG.md` y
  código/config. `docs/` es la única fuente documental.

## Regla de mantenimiento

Editar la fuente de verdad una sola vez (el `.md` canónico). Si aparece el mismo dato duplicado en
otro `.md`, mover la referencia (no copiar contenido) hacia `docs/`.
