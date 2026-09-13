-- ==============================================================
-- MIGRACIÓN: add_rls_phase10 — cierre de RLS sobre admin_users
-- ==============================================================
-- Proyecto: portadora-eros (ref xvwmngtdzuzfnqelcjzf)
-- Idempotente. Ejecutar como UN batch en SQL Editor / database/query.
--
-- CONTEXTO (ORN-77):
--   `migration_phase10.sql` agregaba `admin_settings.business_hours` y fue
--   SUPERSEDED por 0001_canonical_schema.sql (columna inline). El RLS del
--   schema público ya está cubierto por migration_security_rls_allowlist.sql
--   (services, appointments, blocked_times, clients, contact_messages,
--   admin_settings) y por push_subscriptions.sql (own-row policies).
--
--   Única brecha detectada: `public.admin_users` tiene RLS habilitada pero
--   CERO policies, por lo que NADIE (ni siquiera un admin autenticado) puede
--   hacer SELECT directo sobre la allowlist. Esto NO rompe la app porque
--   `is_admin()` es SECURITY DEFINER y `requireAdmin()` consulta vía RPC, pero
--   deja la tabla de autorización inaccesible por la capa de datos.
--
--   Esta migración cierra esa brecha: allowlist legible solo por admins.
--   No toca datos (ninguna operación de escritura sobre tablas existentes).
-- ==============================================================

-- 0. is_admin() — garantizar que exista (SECURITY DEFINER, idempotente).
--    Recreado con IF NOT EXISTS-safe vía CREATE OR REPLACE (igual que
--    migration_security_rls_allowlist.sql), para que esta migración sea
--    autocontenida si se aplica en un entorno limpio.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
    );
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- 1. admin_users — RLS habilitada (idempotente) + lectura solo admin.
--    No se expone escritura vía RLS: la allowlist se gestiona con
--    SUPABASE_SERVICE_ROLE_KEY (server-side), patrón ya documentado en
--    ADR-0001. El admin autenticado solo necesita LEER la lista.
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_admin_users" ON public.admin_users;
CREATE POLICY "admin_read_admin_users"
    ON public.admin_users FOR SELECT TO authenticated
    USING (public.is_admin());

-- 2. Recarga cache de esquema PostgREST
NOTIFY pgrst, 'reload schema';

-- ==============================================================
-- VERIFICACIÓN POST-APPLY (SQL)
-- ==============================================================
-- SELECT relname, relrowsecurity FROM pg_class
--   WHERE relname IN ('admin_users');
--   => (admin_users, true)
-- SELECT tablename, policyname, cmd FROM pg_policies
--   WHERE schemaname='public' AND tablename='admin_users';
--   => (admin_users, admin_read_admin_users, SELECT)
-- ==============================================================