-- ==============================================================
-- MIGRACIÓN COMPLETA - Portadora de Eros
-- Email admin: portadoradeeros@gmail.com
-- Ejecutar en el SQL Editor de Supabase
-- ==============================================================
-- ==============================================================
-- 1. CREACIÓN DE TABLAS (si no existen)
-- ==============================================================
-- Tabla: services
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
-- Tabla: appointments
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
-- Tabla: admin_settings
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
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
-- Tabla: contact_messages (mensajes del formulario de contacto)
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
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
-- Insertar servicios por defecto
INSERT INTO public.services (
        slug,
        title,
        short_description,
        description,
        price,
        duration,
        is_visible,
        icon
    )
VALUES (
        'tarot',
        'Sesion de Tarot',
        'Explora tu pasado, presente y futuro a traves de las cartas',
        'Las cartas del tarot son una herramienta ancestral que permite explorar el pasado, presente y futuro. En tu sesion, sumergiremos en los arquetipos y simbolos para guiarte en tus decisiones y revelar lo que el universo tiene preparado para ti.',
        5000,
        60,
        true,
        'tarot'
    ),
    (
        'buzios',
        'Sesion de Buzios',
        'Conexion con los orishas para recibir mensajes divinos',
        'Los buzios son conchas sagradas utilizadas en la religion de origen africano para comunicarse con los orishas y recibir mensajes divinos. Esta sesion te conectara con la sabiduria ancestral para resolver tus preguntas y conflictos.',
        6000,
        90,
        true,
        'buzios'
    ),
    (
        'limpieza-energetica',
        'Limpieza Energetica',
        'Libera tu espacio de energias negativas',
        'Las energias negativas pueden acumularse en nuestro alrededor y afectar nuestra vida cotidiana. A traves de rituales sagrados y tecnicas ancestrales, liberaremos tu espacio de esas energias para que puedas fluir con mayor claridad y bienestar.',
        8000,
        120,
        true,
        'energy'
    ),
    (
        'velomancia',
        'Velomancia',
        'Lee la luz de las velas para recibir mensajes del mas alla',
        'La velomancia es el arte de leer la luz de las velas para revelar mensajes del mas alla. Esta practica ancestral te permitira recibir respuestas de tus seres queridos que ya no estan fisicamente, y encontrar paz en momentos de duda.',
        7000,
        75,
        true,
        'candle'
    ) ON CONFLICT (slug) DO NOTHING;
-- ==============================================================
-- 2. HABILITAR RLS
-- ==============================================================
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
-- contact_messages: cualquiera puede insertar (formulario público de contacto)
DROP POLICY IF EXISTS "publico_envia_mensaje" ON public.contact_messages;
CREATE POLICY "publico_envia_mensaje" ON public.contact_messages FOR
INSERT WITH CHECK (true);
-- contact_messages: solo admin puede leer y gestionar
DROP POLICY IF EXISTS "admin_lee_mensajes" ON public.contact_messages;
CREATE POLICY "admin_lee_mensajes" ON public.contact_messages FOR
SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "admin_actualiza_mensajes" ON public.contact_messages;
CREATE POLICY "admin_actualiza_mensajes" ON public.contact_messages FOR
UPDATE USING (auth.role() = 'authenticated');
-- ==============================================================
-- 3. POLÍTICAS RLS - ELIMINAR ANTIGUAS Y CREAR NUEVAS
-- ==============================================================
-- Services: eliminar políticas existentes
DROP POLICY IF EXISTS "Servicios visibles son públicos" ON public.services;
DROP POLICY IF EXISTS "Admins pueden gestionar todos los servicios" ON public.services;
-- Services: políticas nuevas
-- Cualquiera puede ver servicios visibles
CREATE POLICY "servicios_visibles_publicos" ON public.services FOR
SELECT USING (is_visible = true);
-- Solo usuarios autenticados pueden hacer CRUD completo
CREATE POLICY "admin_gestiona_servicios" ON public.services FOR ALL USING (auth.role() = 'authenticated');
-- Appointments: eliminar políticas existentes
DROP POLICY IF EXISTS "Público puede solicitar turnos" ON public.appointments;
DROP POLICY IF EXISTS "Admins pueden gestionar todos los turnos" ON public.appointments;
-- Appointments: políticas nuevas
-- Cualquiera puede SOLICITAR un turno (insertar) - pero solo datos públicos
CREATE POLICY "publico_solicita_turno" ON public.appointments FOR
INSERT WITH CHECK (true);
-- Usuarios autenticados pueden ver/gestionar turnos
CREATE POLICY "admin_gestiona_turnos" ON public.appointments FOR ALL USING (auth.role() = 'authenticated');
-- Admin_settings: eliminar políticas existentes
DROP POLICY IF EXISTS "Configuración es pública para lectura" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins pueden actualizar configuración" ON public.admin_settings;
-- Admin_settings: políticas nuevas
-- Cualquiera puede LEER configuración pública
CREATE POLICY "configuracion_publica" ON public.admin_settings FOR
SELECT USING (true);
-- Solo admin puede modificar
CREATE POLICY "admin_gestiona_config" ON public.admin_settings FOR ALL USING (auth.role() = 'authenticated');
-- ==============================================================
-- 4. STORAGE
-- ==============================================================
-- Crear bucket si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-images', 'public-images', true) ON CONFLICT (id) DO NOTHING;
-- Eliminar políticas antiguas de storage
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Admin Updates" ON storage.objects;
DROP POLICY IF EXISTS "Admin Deletes" ON storage.objects;
-- Políticas storage nuevas
-- Cualquiera puede ver imágenes públicas
CREATE POLICY "public_access_images" ON storage.objects FOR
SELECT USING (bucket_id = 'public-images');
-- Solo usuarios autenticados pueden subir
CREATE POLICY "admin_uploads" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'public-images'
        AND auth.role() = 'authenticated'
    );
-- Solo usuarios autenticados pueden actualizar
CREATE POLICY "admin_updates" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'public-images'
        AND auth.role() = 'authenticated'
    );
-- Solo usuarios autenticados pueden eliminar
CREATE POLICY "admin_deletes" ON storage.objects FOR DELETE USING (
    bucket_id = 'public-images'
    AND auth.role() = 'authenticated'
);
-- ==============================================================
-- 5. NOTAS IMPORTANTES
-- ==============================================================
/*
 PASOS PARA COMPLETAR LA CONFIGURACIÓN:
 
 1. Ir a Authentication > Providers > Email
 - Desactivar "Confirm email" 
 - Desactivar "Enable Signup"
 - Esto evita que strangers se registren
 
 2. Ir a Authentication > Users
 - Crear usuario: portadoradeeros@gmail.com
 - Establecer contraseña segura
 - Este será el usuario ADMIN
 
 3. El login del admin usará:
 - Email: portadoradeeros@gmail.com
 - Contraseña: la que estableciste en Supabase
 
 4. Verificar que RLS esté funcionando:
 - Intentar acceder como usuario no autenticado
 - Los servicios visibles deben mostrarse
 - Las rutas /admin/* deben redirigir al login
 */