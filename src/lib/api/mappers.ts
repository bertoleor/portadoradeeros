import type { BusinessSettings, Service } from '@/types';
import type { Database } from '@/types/database';

type ServiceRow = Database['public']['Tables']['services']['Row'];
type AdminSettingsRow = Database['public']['Tables']['admin_settings']['Row'];

/**
 * Single source for the snake_case → camelCase key convention shared by the
 * API layer's DB-to-domain mappers (C3). Kept here so the naming transform is
 * defined once instead of being re-implemented per mapper.
 */
export function snakeToCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_match, letter: string) => letter.toUpperCase());
}

/**
 * Project a `services` DB row into the frontend `Service` shape.
 */
export function mapServiceRow(row: ServiceRow): Service {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    description: row.description ?? '',
    price: row.price,
    duration: row.duration,
    isVisible: row.is_visible ?? false,
    icon: row.icon ?? 'sparkles',
    images: row.images ?? [],
  };
}

/**
 * Project the single `admin_settings` DB row into the frontend shape.
 */
export function mapSettingsRow(row: AdminSettingsRow): BusinessSettings {
  return {
    contactEmail: row.contact_email ?? '',
    siteUrl: row.site_url ?? '',
    socialLinks: {
      instagram: row.instagram_url ?? '',
      whatsapp: row.whatsapp_url ?? '',
      tiktok: row.tiktok_url ?? '',
    },
    bankDetails: {
      bankOwner: row.bank_owner ?? '',
      bankName: row.bank_name ?? '',
      cbu: row.bank_cbu ?? '',
      alias: row.bank_alias ?? '',
    },
    bioContent: row.bio_content ?? '',
    profileImageUrl: row.profile_image_url ?? '',
    businessHours: typeof row.business_hours === 'string'
      ? JSON.parse(row.business_hours)
      : row.business_hours || {},
    appointmentDuration: 60,
    adminName: row.admin_name ?? 'Jacque',
    adminAvatarUrl: row.admin_avatar_url ?? '',
  };
}