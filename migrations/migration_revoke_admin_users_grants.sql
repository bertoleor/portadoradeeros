-- =============================================================
-- MIGRACIÓN: Hardening grants en admin_users (ORN-226, P3)
-- =============================================================
-- Proyecto: portadora-eros (ref xvwmngtdzuzfnqelcjzf)
-- Idempotente. Ejecutar como UN batch en SQL Editor / database/query.
--
-- ORIGEN: hallazgo P3 de ORN-135 (t_ver2, 2026-10-20): information_schema.
-- role_table_grants muestra que anon Y authenticated conservan grants de
-- tabla amplios sobre public.admin_users: SELECT, INSERT, UPDATE, DELETE,
-- TRUNCATE, REFERENCES, TRIGGER. Hoy NO es explotable (RLS habilitada y la
-- única policy es admin_read_admin_users SELECT TO authenticated USING
-- is_admin(); sin policy para anon toda operación cae en deny-by-default,
-- verificado con JWT anon real: GET /rest/v1/admin_users -> 200 []).
--
-- RIESGO QUE CIERRA (defense in depth): si RLS se deshabilitara por
-- accidente, anon tendría INSERT/UPDATE/DELETE/TRUNCATE sobre la allowlist
-- de admins. Mismo patrón que khal 0009_revoke_anon_grants.sql (ORN-168 H2).
--
-- POR QUÉ ES SEGURO REVOCAR WRITE:
--   * La allowlist se gestiona server-side con SUPABASE_SERVICE_ROLE_KEY
--     (ADR-0001); anon/authenticated jamás escriben admin_users.
--   * pg_policies confirma cero policies INSERT/UPDATE/DELETE/ALL en
--     admin_users (verificado en DB viva 2026-10-20) -> ningún path de
--     PostgREST escribe la tabla hoy.
--   * La policy admin_read_admin_users (SELECT TO authenticated) sigue
--     funcionando: GRANT SELECT se mantiene (una policy RLS no reemplaza
--     al grant de tabla; PostgREST necesita ambos).
--   * requireAdmin() usa la RPC is_admin() (EXECUTE a authenticated ya
--     otorgado en migration_security_rls_allowlist.sql) — no usa grants
--     de tabla. No se tocan grants de funciones.
--
-- REVOKE es idempotente por naturaleza: revocar privilegios ya ausentes
-- es no-op.
--
-- Down: migration_revoke_admin_users_grants.down.sql (re-grants de
-- emergencia).
-- =============================================================

-- 1. Endurecer grants de tabla: anon y authenticated quedan SELECT-only.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON public.admin_users FROM anon;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON public.admin_users FROM authenticated;

-- Nota: SELECT se mantiene en ambos roles (la policy RLS es la que filtra
-- qué filas puede leer authenticated; anon sin policy -> deny-by-default).
