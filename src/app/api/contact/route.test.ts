import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { NextRequest } from 'next/server';

/* ------------------------------------------------------------------ */
/* Provider mocks (EROS-D2) — the real dispatcher (@/lib/email) must  */
/* pick one based on EMAIL_PROVIDER; only concrete providers are       */
/* mocked here.                                                        */
/* ------------------------------------------------------------------ */

vi.mock('@/lib/email/resend', () => ({
  sendContactFormNotification: vi.fn(async () => ({ success: true, id: 'resend-mock' })),
}));

vi.mock('@/lib/email/smtp', () => ({
  sendContactFormNotification: vi.fn(async () => ({ success: true, id: 'smtp-mock' })),
}));

// Spam protection: not under test here — neutralize rate limit + honeypot.
vi.mock('@/lib/spam-protection', () => ({
  HONEYPOT_FIELD: 'company_website',
  isHoneypotTriggered: vi.fn(() => false),
  checkRateLimit: vi.fn(() => ({ limited: false })),
  SPAM_RATE_LIMIT: { maxRequests: 5, windowMs: 60_000 },
  resolveClientIp: vi.fn(() => '127.0.0.1'),
}));

/* ------------------------------------------------------------------ */
/* Supabase mock (EROS-B3): the insert result is driven per-test via   */
/* a hoisted mutable holder — default is a successful insert.           */
/* ------------------------------------------------------------------ */
const { supabaseState } = vi.hoisted(() => ({
  supabaseState: {
    insertError: null as null | { message: string; code?: string },
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      insert: vi.fn(async () => ({ error: supabaseState.insertError })),
    })),
  })),
}));

import { contactSchema, POST } from './route';

describe('contactSchema', () => {
  it('accepts a minimal valid contact payload', () => {
    const r = contactSchema.safeParse({
      name: 'Ana',
      email: 'ana@example.com',
      message: 'Hola, quiero un turno.',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.phone).toBeUndefined();
    }
  });

  it('accepts optional phone and honeypot fields', () => {
    const r = contactSchema.safeParse({
      name: 'Ana',
      email: 'ana@example.com',
      message: 'Hola',
      phone: '+54 11 5555 5555',
      company_website: '',
    });
    expect(r.success).toBe(true);
  });

  it('rejects a missing name', () => {
    const r = contactSchema.safeParse({ email: 'a@b.com', message: 'Hola' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === 'name')).toBe(true);
    }
  });

  it('rejects a missing message', () => {
    const r = contactSchema.safeParse({ name: 'Ana', email: 'a@b.com' });
    expect(r.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const bad = ['nope', 'a b@c.com', '@sinlocal.com'];
    for (const email of bad) {
      const r = contactSchema.safeParse({ name: 'Ana', email, message: 'Hola' });
      expect(r.success, `should reject email "${email}"`).toBe(false);
    }
  });

  it('rejects a fully empty payload', () => {
    expect(contactSchema.safeParse({}).success).toBe(false);
  });

  /* H3 hardening — payload caps + server-side trim (F4-refresh 2026-10-07) */

  it('rejects over-long fields (payload cap on a public form)', () => {
    const base = { name: 'Ana', email: 'a@b.com', message: 'Hola' };
    expect(
      contactSchema.safeParse({ ...base, name: 'x'.repeat(201) }).success
    ).toBe(false);
    expect(
      contactSchema.safeParse({ ...base, message: 'x'.repeat(5001) }).success
    ).toBe(false);
    expect(
      contactSchema.safeParse({ ...base, phone: '5'.repeat(51) }).success
    ).toBe(false);
  });

  it('trims surrounding whitespace server-side', () => {
    const r = contactSchema.safeParse({
      name: '  Ana  ',
      email: 'ana@example.com',
      message: '  Hola  ',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.name).toBe('Ana');
      expect(r.data.message).toBe('Hola');
    }
  });

  it('rejects a name that is only whitespace after trim', () => {
    expect(
      contactSchema.safeParse({ name: '   ', email: 'a@b.com', message: 'Hola' }).success
    ).toBe(false);
  });
});

describe('POST /api/contact — email provider dispatch (EROS-D2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.EMAIL_PROVIDER;
  });

  function makeRequest(): NextRequest {
    return new Request('http://localhost:3000/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ana',
        email: 'ana@example.com',
        message: 'Hola, quiero un turno.',
      }),
      headers: { 'content-type': 'application/json' },
    }) as unknown as NextRequest;
  }

  it('routes the admin notification through SMTP when EMAIL_PROVIDER=smtp', async () => {
    process.env.EMAIL_PROVIDER = 'smtp';
    try {
      const response = await POST(makeRequest());
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);

      const smtp = await import('@/lib/email/smtp');
      expect(vi.mocked(smtp.sendContactFormNotification)).toHaveBeenCalledTimes(1);

      const resend = await import('@/lib/email/resend');
      expect(vi.mocked(resend.sendContactFormNotification)).not.toHaveBeenCalled();
    } finally {
      delete process.env.EMAIL_PROVIDER;
    }
  });

  it('keeps Resend as the default provider when EMAIL_PROVIDER is unset', async () => {
    const response = await POST(makeRequest());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const resend = await import('@/lib/email/resend');
    expect(vi.mocked(resend.sendContactFormNotification)).toHaveBeenCalledTimes(1);
  });
});

describe('POST /api/contact — insert persistence flags (EROS-B3)', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.EMAIL_PROVIDER;
    supabaseState.insertError = null;
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeRequest(): NextRequest {
    return new Request('http://localhost:3000/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ana',
        email: 'ana@example.com',
        message: 'Hola, quiero un turno.',
      }),
      headers: { 'content-type': 'application/json' },
    }) as unknown as NextRequest;
  }

  it('reports dbSaved: true when the insert succeeds', async () => {
    const response = await POST(makeRequest());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.dbSaved).toBe(true);
    expect(body.emailSent).toBe(true);
  });

  it('reports dbSaved: false (with 200) when the insert fails — lead not silently lost', async () => {
    supabaseState.insertError = {
      message: 'relation "contact_messages" does not exist',
      code: '42P01',
    };

    const response = await POST(makeRequest());
    const body = await response.json();

    // The lead reached the admin by email; only the audit copy failed.
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.dbSaved).toBe(false);
    expect(body.emailSent).toBe(true);
  });

  it('logs the insert failure through logger.error (observable in prod)', async () => {
    supabaseState.insertError = { message: 'network unreachable', code: 'ECONNREFUSED' };

    await POST(makeRequest());

    expect(errorSpy).toHaveBeenCalled();
    const out = errorSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n');
    expect(out).toContain('contact_messages');
    expect(out).toContain('network unreachable');
  });
});
