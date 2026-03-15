-- Agregar campo de imágenes a la tabla services
-- El campo será un array de strings para soportar múltiples imágenes
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Actualizar la política RLS para incluir el nuevo campo (ya incluida en la política existente)
