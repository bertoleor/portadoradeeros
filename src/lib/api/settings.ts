'use server';

import { createClient } from '@/lib/supabase/server';
import { BusinessSettings } from '@/types';

// Map DB row to Frontend Shape
function mapDBToSettings(dbRow: Record<string, unknown>): BusinessSettings {
  return {
    contactEmail: (dbRow.contact_email as string) || '',
    siteUrl: (dbRow.site_url as string) || '',
    socialLinks: {
      instagram: (dbRow.instagram_url as string) || '',
      whatsapp: (dbRow.whatsapp_url as string) || '',
      tiktok: (dbRow.tiktok_url as string) || '',
    },
    bankDetails: {
      bankOwner: (dbRow.bank_owner as string) || '',
      bankName: (dbRow.bank_name as string) || '',
      cbu: (dbRow.bank_cbu as string) || '',
      alias: (dbRow.bank_alias as string) || '',
    },
    bioContent: (dbRow.bio_content as string) || '',
    profileImageUrl: (dbRow.profile_image_url as string) || '',
    businessHours: typeof dbRow.business_hours === 'string'
      ? JSON.parse(dbRow.business_hours)
      : dbRow.business_hours || {},
    appointmentDuration: 60,
    adminName: (dbRow.admin_name as string) || 'Jacque',
    adminAvatarUrl: (dbRow.admin_avatar_url as string) || '',
  };
}

export async function getAdminSettings(): Promise<BusinessSettings | null> {
  const supabase = await createClient();
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

  return mapDBToSettings(data);
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
) {
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
    return { success: false, error: error.message };
  }

  return { success: true };
}
