-- ==============================================================
-- SCHEMA SUPABASE PARA PORTADORA DE EROS
-- Ejecutar todo este código en el "SQL Editor" de Supabase
-- ==============================================================
-- 1. CREACIÓN DE TABLAS
-- Tabla: services (Servicios ofrecidos)
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    short_description TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL DEFAULT 60,
    is_visible BOOLEAN DEFAULT false,
    icon TEXT DEFAULT 'sparkles',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Tabla: appointments (Turnos agendados)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID REFERENCES public.services(id) ON DELETE
    SET NULL,
        client_name TEXT NOT NULL,
        client_email TEXT NOT NULL,
        client_phone TEXT,
        appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
        notes TEXT,
        status TEXT DEFAULT 'pending' CHECK (
            status IN ('pending', 'confirmed', 'cancelled', 'completed')
        ),
        google_event_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Tabla: admin_settings (Configuración general del sitio y perfil)
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
    -- Asegura que solo haya una fila de configuración
    instagram_url TEXT,
    whatsapp_url TEXT,
    contact_email TEXT,
    bio_content TEXT,
    business_hours JSONB,
    profile_image_url TEXT,
    bank_owner TEXT,
    bank_cbu TEXT,
    bank_alias TEXT,
    bank_name TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Insertar valores por defecto para admin_settings
INSERT INTO public.admin_settings (
        id,
        instagram_url,
        whatsapp_url,
        contact_email,
        bio_content,
        bank_owner,
        bank_cbu,
        bank_alias,
        bank_name
    )
VALUES (
        1,
        'https://instagram.com/portadoradeeros',
        'https://wa.me/5491100000000',
        'portadoradeeros@gmail.com',
        '<h2>Mi Camino Espiritual</h2><p>Mi nombre es Jacque...</p>',
        'Jacqueline',
        '0000000000000000000000',
        'PORTADORA.EROS',
        'Banco Nación'
    ) ON CONFLICT (id) DO NOTHING;
-- ==============================================================
-- 2. POLÍTICAS DE SEGURIDAD RLS (Row Level Security)
-- NOTA IMPORTANTE: Debes ir a "Authentication" -> "Providers" -> "Email" 
-- y DESACTIVAR "Confirm email" y "Enable Signup". 
-- Creá el usuario portadoradeeros@gmail.com manualmente desde "Authentication" -> "Users".
-- Así, cualquier usuario logueado (= vos) es Administrador.
-- ==============================================================
-- Habilitar RLS en todas las tablas
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
-- Políticas para `services`
-- Lectura pública: Cualquiera puede ver los servicios que están visibles
CREATE POLICY "Servicios visibles son públicos" ON public.services FOR
SELECT USING (is_visible = true);
-- Lectura y Escritura Admin: Solo usuarios autenticados (Jacque) pueden hacer todo
CREATE POLICY "Admins pueden gestionar todos los servicios" ON public.services FOR ALL USING (auth.role() = 'authenticated');
-- Políticas para `appointments`
-- Inserción pública: Cualquiera puede crear un turno (agendar desde el sitio web)
CREATE POLICY "Público puede solicitar turnos" ON public.appointments FOR
INSERT WITH CHECK (true);
-- Lectura y Escritura Admin: Solo la cuenta admin puede ver y modificar los turnos
CREATE POLICY "Admins pueden gestionar todos los turnos" ON public.appointments FOR ALL USING (auth.role() = 'authenticated');
-- Políticas para `admin_settings`
-- Lectura pública: Cualquiera puede leer la info de contacto y el sobre mí
CREATE POLICY "Configuración es pública para lectura" ON public.admin_settings FOR
SELECT USING (true);
-- Lectura y Escritura Admin: Solo admin puede modificar las redes y configuraciones
CREATE POLICY "Admins pueden actualizar configuración" ON public.admin_settings FOR ALL USING (auth.role() = 'authenticated');
-- ==============================================================
-- 3. STORAGE (Opcional, para subir imágenes)
-- Ejecutar solo si vas a subir las fotos directamente a Supabase
-- ==============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-images', 'public-images', true);
CREATE POLICY "Public Access" ON storage.objects FOR
SELECT USING (bucket_id = 'public-images');
CREATE POLICY "Admin Uploads" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'public-images'
        AND auth.role() = 'authenticated'
    );
CREATE POLICY "Admin Updates" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'public-images'
        AND auth.role() = 'authenticated'
    );
CREATE POLICY "Admin Deletes" ON storage.objects FOR DELETE USING (
    bucket_id = 'public-images'
    AND auth.role() = 'authenticated'
);
-- Fin del script