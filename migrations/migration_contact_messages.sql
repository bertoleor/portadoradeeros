-- ==============================================================
-- MIGRACIÓN: Tabla de mensajes de contacto
-- Ejecutar en el SQL Editor de Supabase
-- NOTA: Este script es idempotente - se puede ejecutar múltiples veces
-- ==============================================================

-- Crear tabla contact_messages (IF NOT EXISTS para evitar errores)
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Política: Cualquier persona puede enviar mensajes (público)
DROP POLICY IF EXISTS "Cualquiera puede enviar mensajes" ON public.contact_messages;
CREATE POLICY "Cualquiera puede enviar mensajes" ON public.contact_messages 
FOR INSERT WITH CHECK (true);

-- Política: Solo admin puede leer mensajes
DROP POLICY IF EXISTS "Admin puede leer mensajes" ON public.contact_messages;
CREATE POLICY "Admin puede leer mensajes" ON public.contact_messages 
FOR SELECT USING (auth.role() = 'authenticated');

-- Política: Solo admin puede actualizar estado
DROP POLICY IF EXISTS "Admin puede actualizar mensajes" ON public.contact_messages;
CREATE POLICY "Admin puede actualizar mensajes" ON public.contact_messages 
FOR UPDATE USING (auth.role() = 'authenticated');

-- Nota: No hay política DELETE para evitar eliminación accidental de mensajes

-- Fin de migración
