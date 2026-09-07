'use server';

import { unstable_cache, revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createReadClient } from '@/lib/supabase/readonly';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { BusinessSettings } from '@/types';
import { mapSettingsRow } from '@/lib/api/mappers';
import { AppError, ok, type Result } from '@/lib/api/error';

const SETTINGS_CACHE_TAG = 'admin-settings';

const fetchAdminSettings = unstable_cache(
  async (): Promise<BusinessSettings | null> => {
    // Cookie-free anon read (RLS public-read): safe to cache and role-independent.
    const supabase = createReadClient();
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !data) {
      if (error && error.code !== 'PGRST116') { // PGRST116 is 'no rows' which we handle
        console.error('Error fetching admin settings:', error.message, error.details);
      }
      return null;
    }

    return mapSettingsRow(data);
  },
  ['admin-settings'],
  { tags: [SETTINGS_CACHE_TAG], revalidate: 300 }
);

export async function getAdminSettings(): Promise<BusinessSettings | null> {
  return fetchAdminSettings();
}

export async function updateAdminSettings(
  updates: Partial<{
    instagramUrl: string;
    whatsappUrl: string;
    tiktokUrl: string;
    siteUrl: string;
    contactEmail: string;
    bioContent: string;
    profileImageUrl: string;
    bankOwner: string;
    bankName: string;
    bankCbu: string;
    bankAlias: string;
    businessHours: Record<string, unknown>;
    adminName?: string;
    adminAvatarUrl?: string;
  }>
): Promise<Result<{ id: number }>> {
  await requireAdmin();

  const supabase = await createClient();

  const dbPayload: Record<string, unknown> = {};
  if (updates.instagramUrl !== undefined) dbPayload.instagram_url = updates.instagramUrl;
  if (updates.whatsappUrl !== undefined) dbPayload.whatsapp_url = updates.whatsappUrl;
  if (updates.tiktokUrl !== undefined) dbPayload.tiktok_url = updates.tiktokUrl;
  if (updates.siteUrl !== undefined) dbPayload.site_url = updates.siteUrl;
  if (updates.contactEmail !== undefined) dbPayload.contact_email = updates.contactEmail;
  if (updates.bioContent !== undefined) dbPayload.bio_content = updates.bioContent;
  if (updates.profileImageUrl !== undefined) dbPayload.profile_image_url = updates.profileImageUrl;
  if (updates.bankOwner !== undefined) dbPayload.bank_owner = updates.bankOwner;
  if (updates.bankName !== undefined) dbPayload.bank_name = updates.bankName;
  if (updates.bankCbu !== undefined) dbPayload.bank_cbu = updates.bankCbu;
  if (updates.bankAlias !== undefined) dbPayload.bank_alias = updates.bankAlias;
  if (updates.adminName !== undefined) dbPayload.admin_name = updates.adminName;
  if (updates.adminAvatarUrl !== undefined) dbPayload.admin_avatar_url = updates.adminAvatarUrl;

  // Supabase JSONB column handles objects directly
  if (updates.businessHours !== undefined) {
    dbPayload.business_hours = updates.businessHours;
  }

  const { error } = await supabase
    .from('admin_settings')
    .upsert({ ...dbPayload, id: 1 }, { onConflict: 'id' });

  if (error) {
    console.error('Error updating admin settings:', error.message, error.details, error.hint);
    throw new AppError('DB', error.message);
  }

  revalidateTag(SETTINGS_CACHE_TAG, { expire: 0 });
  return ok({ id: 1 });
}