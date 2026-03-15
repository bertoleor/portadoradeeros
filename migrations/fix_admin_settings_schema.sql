-- ==============================================================
-- REPARACIÓN DE ESQUEMA: admin_settings
-- Ejecutar este script en el SQL Editor de Supabase para corregir
-- los errores de columnas faltantes (business_hours, tiktok, etc.)
-- ==============================================================

-- 1. Agregar columnas faltantes si no existen
ALTER TABLE public.admin_settings 
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{"monday": {"end": "18:00", "start": "09:00", "closed": false}, "friday": {"end": "18:00", "start": "09:00", "closed": false}, "sunday": {"end": "", "start": "", "closed": true}, "tuesday": {"end": "18:00", "start": "09:00", "closed": false}, "saturday": {"end": "14:00", "start": "10:00", "closed": false}, "thursday": {"end": "18:00", "start": "09:00", "closed": false}, "wednesday": {"end": "18:00", "start": "09:00", "closed": false}}'::jsonb;

ALTER TABLE public.admin_settings 
ADD COLUMN IF NOT EXISTS tiktok_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS site_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS admin_name TEXT DEFAULT 'Jacque',
ADD COLUMN IF NOT EXISTS admin_avatar_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS bank_alias TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS bank_cbu TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS bank_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS bank_owner TEXT DEFAULT 'Jacqueline';

-- 2. Forzar recarga del caché de esquema para PostgREST (Supabase API)
NOTIFY pgrst, 'reload schema';

-- 3. Verificar (opcional, saldrá en los logs del SQL editor)
DO $$ 
BEGIN 
    RAISE NOTICE 'Esquema admin_settings actualizado correctamente.';
END $$;
