'use server';

import { createClient } from '@/lib/supabase/server';

export async function uploadImage(formData: FormData) {
  const file = formData.get('file') as File | null;

  if (!file) {
    return { success: false, error: 'No se propocionó ninguna imagen.' };
  }

  const supabase = await createClient();

  // Get current session to verify auth
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error('Session error:', sessionError);
  }
  
  if (!session) {
    return { success: false, error: 'No autorizado. Debes iniciar sesión como administrador.' };
  }

  // Create a unique file name
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('public-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    return { success: false, error: 'Error al subir la imagen al servidor.' };
  }

  // Generate the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('public-images')
    .getPublicUrl(filePath);

  return { success: true, url: publicUrl };
}
