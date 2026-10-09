# EROS — Gaps triaje A/B/C (UNVERIFIED, dry-run kanban)

Origen: `reports/auditor/general-eros-2026-09-12.md`. Nada aplicado, nada borrado.

> ⚠️ **Corrección 2026-09-30 (EROS-D4):** EROS-A2 se originó leyendo `migration_phase10.sql` con el
> schema legacy equivocado de referencia. Hoy el linaje canónico es
> `migrations/0001_canonical_schema.sql` + `migration_security_rls_allowlist.sql` +
> `add_rls_phase10.sql` (ver `migrations/README.md`); `migration_phase10.sql` es SUPERSEDED (columna
> inline en el canónico) y A2 está CERRADO (board-eros 2026-09-30).

## 🔴 A — Hacer ya (bloquean producción o abuso)

| ID      | Gap                                                                                                      | Lente   | Acción propuesta                                                                      |
| ------- | -------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------- |
| EROS-A1 | Sin rate-limit en `POST /api/appointments` y `POST /api/contact` (spam/abuso abierto)                    | L6      | Rate-limit 5/min por IP + honeypot; retest manual                                     |
| EROS-A2 | `migration_phase10.sql` sin policies (0 `CREATE POLICY`): si crea/expande tablas, podrían quedar sin RLS | L5/Gate | Revisar migración vs schema; agregar policies espejo + `is_admin()` donde corresponda |

## 🟡 B — Próximo ciclo

| ID      | Gap                                                                | Lente | Acción propuesta                                                             |
| ------- | ------------------------------------------------------------------ | ----- | ---------------------------------------------------------------------------- |
| EROS-B1 | Cobertura tests mínima (1 archivo, solo contrato de errores)       | L4    | Tests para `sanitizeBioContent`, schemas Zod, `requireAdmin` (mock supabase) |
| EROS-B2 | Sin captcha/honeypot en formularios públicos                       | L6    | Honeypot invisible primero (costo cero); Turnstile solo si persiste spam     |
| EROS-B3 | `contact/route.ts` silencia fallo de insert (solo `console.error`) | L6    | Logger estructurado + flag `dbSaved:false` en respuesta para reintento admin |
| EROS-B4 | Minor stack updates pendientes (no ejecutados: red + build largo)  | L2    | `npm outdated` → minors → `tsc`+`build` en ventana con humano presente       |

## 🟢 C — Mejora continua

| ID      | Gap                                                            | Lente | Acción propuesta                                                               |
| ------- | -------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------ |
| EROS-C1 | `maximumScale: 1` contradice `userScalable: true` (WCAG 1.4.4) | L8    | Quitar `maximumScale` de `viewport` en `layout.tsx`                            |
| EROS-C2 | README de 1 línea; sin CHANGELOG/ADRs (parcialmente resuelto)  | L10   | ✅ `CHANGELOG.md` + `docs/adr/0001` creados; ampliar README con setup local    |
| EROS-C3 | Deuda histórica: `AUDITORIA_*.md`/`PLAN_*.md` sueltos en raíz  | L10   | Consolidar a `docs/` (mover, NO borrar) con índice — requiere ok (toca layout) |

## Kanban (dry-run)

No existe script `audit_to_kanban` en el repo ni en `E:/Hermes/scripts` asociado al proyecto;
importación real pendiente de herramienta/destino (requiere dato humano). Columnas sugeridas:
`Backlog ← EROS-A1, EROS-A2 | B ← B1–B4 | C ← C1–C3`. Este archivo ES el payload de importación.
