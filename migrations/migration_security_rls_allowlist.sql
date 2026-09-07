-- ==============================================================
-- MIGRACIÓN: Security foundation — Slice 1 (CORRECTED)
-- ==============================================================
-- Proyecto: portadora-eros (ref xvwmngtdzuzfnqelcjzf)
-- Idempotente. Ejecutar como UN batch en SQL Editor / database/query.
--
-- CORRECCIÓN DE DIAGNÓSTICO (verificado en DB live):
--   RLS YA está habilitada (rls=true) en todas las tablas. El problema
--   no era "RLS apagado" sino:
--     (a) policies "auth.role()='authenticated'" = CUALQUIER usuario
--         logueado es admin (bug S3), en 5 tablas;
--     (b) appointments INSERT público con WITH CHECK(true) (bug S6);
--     (c) clients sin NINGUNA policy => admin no puede gestionar clientes.
--   Esta migración: crea la allowlist admin_users + is_admin() y
--   REEMPLAZA esas policies por versión is_admin(), sin tocar push_subscriptions.
--
-- ORDEN CRÍTICO: sembrar admin ANTES de habilitar políticas is_admin().
-- ==============================================================

-- 1. ALLOWLIST ADMIN
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email      TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

INSERT INTO public.admin_users (user_id, email)
VALUES ('6b4942b1-8ac1-4462-b234-f26e13126d76', 'portadoradeeros@gmail.com')
ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;

-- 2. is_admin() — predicado SECURITY DEFINER único
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

-- 3. DROP de policies existentes en las 6 tablas objetivo
--    (robusto ante cambios de nombre/encoding de acentos)
DO $$
DECLARE pol record;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('clients','appointments','blocked_times',
                            'contact_messages','admin_settings','services')
    LOOP
        EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 4. clients — solo admin (agrega la policy faltante; hoy nadie puede tocarla)
CREATE POLICY "admin_clients_full"
    ON public.clients FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5. appointments — admin full + inserción pública SOLO pending
CREATE POLICY "admin_appointments_full"
    ON public.appointments FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "public_insert_pending_appointments"
    ON public.appointments FOR INSERT TO anon
    WITH CHECK (status = 'pending');

-- 6. blocked_times — admin full + lectura pública (disponibilidad, no PII)
CREATE POLICY "admin_blocked_times_full"
    ON public.blocked_times FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "public_read_blocked_times"
    ON public.blocked_times FOR SELECT TO anon USING (true);

-- 7. contact_messages — inserción pública (formulario) + admin full; sin lectura anon
CREATE POLICY "public_insert_contact_messages"
    ON public.contact_messages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "admin_contact_messages_full"
    ON public.contact_messages FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 8. admin_settings — lectura pública + escritura solo admin
CREATE POLICY "public_read_admin_settings"
    ON public.admin_settings FOR SELECT TO anon USING (true);
CREATE POLICY "admin_manage_admin_settings"
    ON public.admin_settings FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 9. services — lectura pública de visibles + admin full (fix S3)
CREATE POLICY "public_read_services"
    ON public.services FOR SELECT TO anon USING (is_visible = true);
CREATE POLICY "admin_manage_services"
    ON public.services FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 10. Recarga cache de esquema PostgREST
NOTIFY pgrst, 'reload schema';

-- ==============================================================
-- VERIFICACIÓN POST-APPLY (SQL)
-- ==============================================================
-- SELECT * FROM public.admin_users; -- 1 fila UID 6b4942b1-...
-- SELECT relname, relrowsecurity FROM pg_class
--   WHERE relname IN ('clients','appointments','blocked_times','contact_messages','admin_settings','services');
-- SELECT tablename, policyname, cmd, qual, with_check FROM pg_policies
--   WHERE schemaname='public'
--     AND tablename IN ('clients','appointments','blocked_times','contact_messages','admin_settings','services')
--   ORDER BY tablename, policyname;
--   => debe haber 0 policies con "auth.role() = 'authenticated'" dentro de esas tablas.
-- ==============================================================