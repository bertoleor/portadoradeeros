'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function uploadImage(formData: FormData) {
  // Defense-in-depth guard (D-SEC-3): only allowlisted admins may upload. This
  // rejects any non-allowlist user at the guard, not just at the session check.
  await requireAdmin();

  const file = formData.get('file') as File | null;

  if (!file) {
    return { success: false, error: 'No se propocionó ninguna imagen.' };
  }

  const supabase = await createClient();

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
