'use server';

import { AppError, fail, ok, type Result } from '@/lib/api/error';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createClient } from '@/lib/supabase/server';

/**
 * Uploads an image to Supabase Storage and returns its public URL.
 *
 * Follows the shared `Result<T>` / `AppError` contract of the data layer
 * instead of the legacy `{ success: boolean, url?, error? }` shape. Uses
 * `AppError('VALIDATION')` for a missing file and `AppError('DB')` for a
 * storage failure. The allowlist guard (`requireAdmin`) throws `AppError`
 * (`UNAUTHORIZED`) before any storage work.
 */
export async function uploadImage(formData: FormData): Promise<Result<{ url: string }>> {
  // Defense-in-depth guard (D-SEC-3): only allowlisted admins may upload. This
  // rejects any non-allowlist user at the guard, not just at the session check.
  await requireAdmin();

  const file = formData.get('file') as File | null;

  if (!file) {
    return fail(new AppError('VALIDATION', 'No se propocionó ninguna imagen.'));
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
    return fail(new AppError('DB', 'Error al subir la imagen al servidor.'));
  }

  // Generate the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('public-images').getPublicUrl(filePath);

  return ok({ url: publicUrl });
}
