import type { SocialLinks } from '@/types';

/**
 * Social media links configuration
 * Used across the site and in admin settings
 */

export const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  instagram: '',
  facebook: '',
  twitter: '',
  whatsapp: '',
  tiktok: '',
  youtube: '',
};

// Single source of truth for the business WhatsApp fallback (ORN-180).
// No component or page may hardcode a wa.me URL — they all resolve here.
const BUSINESS_WHATSAPP_URL = 'https://wa.me/5491138854297';

/**
 * Resolve the public WhatsApp URL shown across the site.
 * Precedence: admin settings → NEXT_PUBLIC_WHATSAPP_URL env → business literal.
 * Blank or whitespace-only values are treated as absent at every level.
 */
export function resolveWhatsAppUrl(settingsUrl?: string | null): string {
  const fromSettings = settingsUrl?.trim();
  if (fromSettings) {
    return fromSettings;
  }
  const fromEnv = process.env.NEXT_PUBLIC_WHATSAPP_URL?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  return BUSINESS_WHATSAPP_URL;
}

// Support channel of the admin dashboard — semantically distinct from the
// business number: never comes from admin settings, only from env,
// defaulting to the current literal so behavior is preserved.
export const SUPPORT_WHATSAPP_URL: string =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_URL || 'https://wa.me/5491173643504';

// Helper to get display URL
export const getSocialUrl = (platform: keyof SocialLinks, username: string): string => {
  if (!username) {
    return '';
  }

  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${username.replaceAll('@', '')}`;
    case 'facebook':
      return username.startsWith('http') ? username : `https://facebook.com/${username}`;
    case 'twitter':
      return `https://twitter.com/${username.replaceAll('@', '')}`;
    case 'whatsapp':
      return `https://wa.me/${username.replaceAll(/\D/g, '')}`;
    case 'tiktok':
      return `https://tiktok.com/@${username.replaceAll('@', '')}`;
    case 'youtube':
      return username.startsWith('http') ? username : `https://youtube.com/${username}`;
    default:
      return username;
  }
};

// Helper to get platform icon name
export const getPlatformIcon = (platform: keyof SocialLinks): string => {
  switch (platform) {
    case 'instagram':
      return 'Instagram';
    case 'facebook':
      return 'Facebook';
    case 'twitter':
      return 'Twitter';
    case 'whatsapp':
      return 'WhatsApp';
    case 'tiktok':
      return 'Music';
    case 'youtube':
      return 'Youtube';
    default:
      return 'Link';
  }
};
