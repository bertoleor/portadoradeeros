import { describe, expect, it } from 'vitest';

import { buildWhatsAppLink } from '@/lib/whatsapp';

describe('whatsapp: buildWhatsAppLink', () => {
  it('builds a bare wa.me link for a valid phone', () => {
    expect(buildWhatsAppLink('5491112345678')).toBe('https://wa.me/5491112345678');
  });

  it('strips separators before building', () => {
    expect(buildWhatsAppLink('+54 9 11 1234-5678')).toBe('https://wa.me/5491112345678');
  });

  it('appends an encoded message when provided', () => {
    expect(buildWhatsAppLink('5491112345678', 'Hola, quiero un turno')).toBe(
      'https://wa.me/5491112345678?text=Hola%2C%20quiero%20un%20turno',
    );
  });

  it('omits ?text= for an empty or blank message', () => {
    expect(buildWhatsAppLink('5491112345678', '')).toBe('https://wa.me/5491112345678');
    expect(buildWhatsAppLink('5491112345678', '   ')).toBe('https://wa.me/5491112345678');
  });

  it('throws on phones with too few, too many, or no digits', () => {
    expect(() => buildWhatsAppLink('1234567')).toThrow('Invalid WhatsApp phone number');
    expect(() => buildWhatsAppLink('1234567890123456')).toThrow('Invalid WhatsApp phone number');
    expect(() => buildWhatsAppLink('')).toThrow('Invalid WhatsApp phone number');
    expect(() => buildWhatsAppLink('abc')).toThrow('Invalid WhatsApp phone number');
  });
});
