-- Tabla para eventos de bloqueo/disponibilidad
CREATE TABLE IF NOT EXISTS public.blocked_times (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time_start TIME,
    time_end TIME,
    is_all_day BOOLEAN DEFAULT false,
    type TEXT NOT NULL DEFAULT 'blocked' CHECK (
        type IN ('blocked', 'occupied', 'event')
    ),
    color TEXT DEFAULT '#ef4444',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Policies RLS
ALTER TABLE public.blocked_times ENABLE ROW LEVEL SECURITY;
-- Cualquiera puede leer los bloqueos (para el calendario)
CREATE POLICY "Bloqueos publicos lectura" ON public.blocked_times FOR
SELECT USING (true);
-- Solo admins pueden gestionar
CREATE POLICY "Admins gestionan bloqueos" ON public.blocked_times FOR ALL USING (auth.role() = 'authenticated');
-- Agregar indice para búsquedas por fecha
CREATE INDEX idx_blocked_times_date ON public.blocked_times(date);