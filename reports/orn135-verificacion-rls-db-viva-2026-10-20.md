# ORN-135 — Verificación RLS admin_users contra DB viva — 2026-10-20

> **Búsqueda:** keywords:
> `orn-135, t_ver2, rls, admin_users, admin_read_admin_users, is_admin, pg_policies, supabase, database/query, portadora de eros, xvwmngtdzuzfnqelcjzf`
> · clasificación: `verificación` · estado: canónico · actualizado: 2026-10-20

- **Fecha:** 2026-10-20 ~08:50 ART · **Autor:** 24-orquestador (turno noche) · **Motivo:** cerrar
  ORN-135 t_ver2 — gate Fase 2 de ORN-133: "migración RLS aplicada en DB viva + verificar
  pg_policies".

## Resumen

**VERIFICADO — el gate ya estaba satisfecho en la DB viva.** La introspección de solo lectura contra
producción (`portadora de eros`, ref `xvwmngtdzuzfnqelcjzf`, Postgres 17.6, vía Management API
`database/query`, PAT `SUPABASE_PAT_3`, todas las queries HTTP 201) muestra que
`migrations/add_rls_phase10.sql` **ya fue aplicado** con el resultado exacto que exige el gate,
aunque el ticket lo marcaría como "falta aplicar". **Decisión de esta corrida: NO re-aplicar** — el
batch es idempotente, pero su `DROP POLICY IF EXISTS` + `CREATE POLICY` re-crearía una policy de
autorización en producción sin ningún delta que ganar (ventana de riesgo innecesaria).

## Gate (ticket) vs estado vivo

| Condición del gate                                                                               | Resultado en vivo                                                                                                                                                                                                                        | Veredicto |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `SELECT pg_policies … tablename='admin_users'` → `(admin_users, admin_read_admin_users, SELECT)` | `[{policyname: "admin_read_admin_users", permissive: "PERMISSIVE", roles: "{authenticated}", cmd: "SELECT", qual: "is_admin()", with_check: null}]`                                                                                      | ✅ exacto |
| `relrowsecurity=true` en `pg_class` para `admin_users`                                           | `[{relname: "admin_users", relrowsecurity: true}]`                                                                                                                                                                                       | ✅        |
| `is_admin()` SECURITY DEFINER (batch item 0)                                                     | `CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$ SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) $$` — idéntico al batch | ✅        |
| GRANT EXECUTE `is_admin()` a `anon, authenticated, service_role`                                 | aclexplode: EXECUTE para `anon`, `authenticated`, `service_role` (+ owner `postgres`); `has_function_privilege('public', …) = false` → **PUBLIC revocado** (más endurecido que el default de Postgres)                                   | ✅        |

## Evidencia adicional

- **RLS general:** 8/8 tablas de `public` con `relrowsecurity=true`, 0 sin RLS, 16 policies activas
  en `public`.
- **Test efectivo anon (PostgREST, JWT anónimo real):**
  `GET https://xvwmngtdzuzfnqelcjzf.supabase.co/rest/v1/admin_users?select=*` → **HTTP 200 con `[]`
  (cero filas)**. La allowlist de admins NO es legible por anon — RLS filtra la lectura aunque
  exista grant de tabla a nivel role (ninguna policy TO anon → deny-by-default).
- **Origen del apply:** `supabase_migrations.schema_migrations` no existe en este proyecto (HTTP 400
  relation does not exist) → el batch se aplicó fuera del pipeline `supabase CLI` (SQL Editor /
  Management API batch, como indica el header del propio archivo: "Ejecutar como UN batch en SQL
  Editor / database/query"). No se encontró receipt previo del apply en `reports/` ni
  `docs/audits/`; esta corrida deja la primera evidencia documentada.

## Hallazgo (P3, no bloqueante — ticketeado, NO trabajado en este turno)

`information_schema.role_table_grants` muestra que **`anon` conserva grants de tabla amplios** sobre
`admin_users`: `SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER` (`authenticated`
ídem). Hoy RLS los neutraliza (la única policy es SELECT TO authenticated; sin policy para anon,
toda operación anónima es deny), pero es el mismo patrón de hardening que khal ticketeó en ORN-214:
un `REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.admin_users FROM anon, authenticated`
eliminaría la superficie si alguna vez RLS se deshabilita por accidente. Ticket de seguimiento
creado con `type: fix-chico`.

## Receips de la corrida

- Pre-check + verificación: `E:/Hermes/tmp/orn135/precheck.py` y `verify2.py` (Management API, solo
  lectura; el PAT nunca se imprime).
- Batch **no ejecutado** contra prod (estado ya correcto; evitar DROP+CREATE innecesario).
- RDD receipt firmado sobre el diff stageado de este archivo antes del push a main (envelope local
  `.rdd/receipt-<sha>.json`).

## Veredicto

**ORN-135 t_ver2: CERRADO-VERIFICADO.** Gate Fase 2 de ORN-133 satisfecho con evidencia viva. Queda
en la familia únicamente t_ver3 (ORN-136, prettier/husky).
