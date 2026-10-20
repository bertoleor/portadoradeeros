# ORN-226 — Hardening grants anon en admin_users — receipt 2026-10-20

> **Búsqueda:** keywords: `orn-226, admin_users, revoke, grants, anon, authenticated, defense in depth, supabase, portadora de eros, xvwmngtdzuzfnqelcjzf`
> · clasificación: `fix-chico (F3.deuda)` · estado: canónico · actualizado: 2026-10-20

- **Fecha:** 2026-10-20 turno noche · **Autor:** G0 ciclo diario EROS (24-orquestador) · **Tipo:** `type: fix-chico`, `Avanza: F3.deuda`
- **Ticket:** [ORN-226](https://linear.app/bertoleor/issue/ORN-226/eros-hardening-grants-anon-en-admin-users-revoke) · **Origen:** hallazgo P3 de ORN-135 (t_ver2, mismo día)

## Resumen

**APLICADO Y VERIFICADO en DB viva.** `anon` y `authenticated` quedaron con grants de tabla **SELECT-only** en `public.admin_users` (antes: SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER). Criterio de cierre del ticket: **cumplido completo**.

## TDD/evidencia (Management API `database/query`, ref `xvwmngtdzuzfnqelcjzf`, PAT `SUPABASE_PAT_3`)

| Paso | Comando/archivo | Resultado |
| --- | --- | --- |
| ROJO (baseline pre-fix) | `tmp/orn226/precheck.py` | HTTP 201: anon+authenticated con los 7 grants; RLS true; única policy `admin_read_admin_users` (SELECT, authenticated, `is_admin()`); 0 policies write |
| Impacto en código | grep `admin_users` en `src/` | solo `requireAdmin.ts` (usa RPC `is_admin()`, no grants de tabla) + types; allowlist se gestiona server-side con service_role (ADR-0001) |
| GREEN (apply batch) | `tmp/orn226/apply_verify.py` (batch = `migrations/migration_revoke_admin_users_grants.sql`) | APPLY HTTP 201; grants_post: anon `SELECT`, authenticated `SELECT`; RLS true; policy intacta; EXECUTE `is_admin()` intacto (3 roles) |
| Test efectivo | `tmp/orn226/effective_anon_test.py` | GET `/rest/v1/admin_users` con JWT anon real → **HTTP 200 `[]`** — superficie pública no rota |

Scripts en `E:/Hermes/tmp/orn226/` (read-only PAT, el PAT nunca se imprime). Mismo método probado de ORN-135 (commits bd9960c).

## Archivos

- `migrations/migration_revoke_admin_users_grants.sql` — fix idempotente (REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER FROM anon, authenticated; SELECT se mantiene)
- `migrations/migration_revoke_admin_users_grants.down.sql` — rollback de emergencia (re-grants)
- `reports/orn226-hardening-grants-admin-users-2026-10-20.md` — este receipt

## Notas

- REVOKE sobre privilegios ausentes es no-op → migración idempotente.
- La policy `admin_read_admin_users` sigue funcional: policy RLS no reemplaza grant de tabla; SELECT en authenticated se mantiene explícitamente.
- Mismo patrón que khal `0009_revoke_anon_grants.sql` (ORN-168 H2 / ORN-214), adaptado a la convención de nombres de eros (`migration_*.sql` con down separado).
- `supabase_migrations.schema_migrations` no existe en este proyecto (verificado ORN-135) → el apply se hace vía SQL Editor / Management API batch, sin ledger del CLI.

## Veredicto

**ORN-226: CERRADO-VERIFICADO.** Grants anon/authenticated en admin_users = SELECT tras migración aplicada en DB viva; verificación con `information_schema.role_table_grants`; test efectivo anon 200 `[]`; panel admin no afectado (requireAdmin usa RPC, intacta).
