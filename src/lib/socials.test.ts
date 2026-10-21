import { afterEach, describe, expect, it, vi } from 'vitest';

const BUSINESS_WHATSAPP_FALLBACK = 'https://wa.me/5491138854297';
const SUPPORT_WHATSAPP_FALLBACK = 'https://wa.me/5491173643504';

/**
 * Env is read at module scope (SUPPORT_WHATSAPP_URL) and at call time
 * (resolveWhatsAppUrl), so every env-dependent case gets a fresh module:
 * stub env → reset module registry → dynamic import → assert.
 * Return type is inferred from the dynamic import.
 */
async function importSocials() {
  vi.resetModules();
  return import('@/lib/socials');
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('resolveWhatsAppUrl — precedence settings → env → literal', () => {
  it('a non-empty settings URL always wins, even over a set env', async () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_URL', 'https://wa.me/549110000000');
    const { resolveWhatsAppUrl } = await importSocials();

    expect(resolveWhatsAppUrl('https://wa.me/549111111111')).toBe('https://wa.me/549111111111');
  });

  it('trims a settings URL before using it', async () => {
    const { resolveWhatsAppUrl } = await importSocials();

    expect(resolveWhatsAppUrl('  https://wa.me/549111111111  ')).toBe('https://wa.me/549111111111');
  });

  it('whitespace-only settings falls through to env', async () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_URL', 'https://wa.me/549110000000');
    const { resolveWhatsAppUrl } = await importSocials();

    expect(resolveWhatsAppUrl('   ')).toBe('https://wa.me/549110000000');
  });

  it('null, undefined and empty settings fall back to env', async () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_URL', 'https://wa.me/549110000000');
    const { resolveWhatsAppUrl } = await importSocials();

    expect(resolveWhatsAppUrl(null)).toBe('https://wa.me/549110000000');
    expect(resolveWhatsAppUrl(undefined)).toBe('https://wa.me/549110000000');
    expect(resolveWhatsAppUrl('')).toBe('https://wa.me/549110000000');
  });

  it('falls back to the business literal when settings and env are unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_URL', '');
    const { resolveWhatsAppUrl } = await importSocials();

    expect(resolveWhatsAppUrl(null)).toBe(BUSINESS_WHATSAPP_FALLBACK);
  });

  it('a whitespace-only env acts as unset and keeps the literal', async () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_URL', '   ');
    const { resolveWhatsAppUrl } = await importSocials();

    expect(resolveWhatsAppUrl(null)).toBe(BUSINESS_WHATSAPP_FALLBACK);
  });
});

describe('SUPPORT_WHATSAPP_URL — support channel of the admin dashboard', () => {
  it('defaults to the support literal when env is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPPORT_WHATSAPP_URL', '');
    const { SUPPORT_WHATSAPP_URL } = await importSocials();

    expect(SUPPORT_WHATSAPP_URL).toBe(SUPPORT_WHATSAPP_FALLBACK);
  });

  it('takes the env value when set', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPPORT_WHATSAPP_URL', 'https://wa.me/549110000001');
    const { SUPPORT_WHATSAPP_URL } = await importSocials();

    expect(SUPPORT_WHATSAPP_URL).toBe('https://wa.me/549110000001');
  });
});
