import { SocialLinks } from '@/types';

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

// Helper to get display URL
export const getSocialUrl = (platform: keyof SocialLinks, username: string): string => {
  if (!username) return '';
  
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
