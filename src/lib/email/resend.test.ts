import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMock = vi.fn();

vi.mock('resend', () => ({
  // vitest 4: mock used as constructor must use `function` in its
  // implementation (arrow functions are not constructable anymore).
  Resend: vi.fn().mockImplementation(function Resend() {
    return {
      emails: { send: sendMock },
    };
  }),
}));

import {
  buildIdempotencyKey,
  resetResendClientForTests,
  sendAppointmentCancellation,
  sendAppointmentConfirmation,
  sendAppointmentConfirmed,
  sendAppointmentReminder,
  sendContactFormNotification,
  sendNewAppointmentNotification,
  type AppointmentEmailData,
} from '@/lib/email/resend';

const sample: AppointmentEmailData = {
  clientName: 'Juana Pérez',
  clientEmail: 'juana@example.com',
  clientPhone: '+5491112345678',
  service: 'Sesión individual',
  date: '2026-09-20',
  time: '16:00',
  price: 50000,
};

function setApiKey(value: string | undefined): void {
  if (value === undefined) {
    delete process.env.RESEND_API_KEY;
  } else {
    process.env.RESEND_API_KEY = value;
  }
  resetResendClientForTests();
}

describe('email/resend (test mode, resend mocked)', () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ data: { id: 'mail-123' }, error: null });
  });

  it('returns not-configured when RESEND_API_KEY is missing', async () => {
    setApiKey(undefined);
    const result = await sendAppointmentConfirmation(sample);
    expect(result).toEqual({ success: false, error: 'Resend not configured' });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('sends confirmation to the client with idempotency key', async () => {
    setApiKey('re_test_key');
    const result = await sendAppointmentConfirmation(sample);
    expect(result).toEqual({ success: true, id: 'mail-123' });
    expect(sendMock).toHaveBeenCalledTimes(1);
    const [payload, options] = sendMock.mock.calls[0] as [
      { from: string; to: string; subject: string; html: string },
      { idempotencyKey: string },
    ];
    expect(payload.from).toContain('onboarding@resend.dev');
    expect(payload.to).toBe('juana@example.com');
    expect(payload.html).toContain('Juana P');
    expect(options.idempotencyKey).toContain('pendiente');
  });

  it('sends admin notification to ADMIN_EMAIL', async () => {
    setApiKey('re_test_key');
    await sendNewAppointmentNotification(sample);
    const [payload] = sendMock.mock.calls[0] as [{ to: string }];
    expect(payload.to).toBe('portadoradeeros@gmail.com');
  });

  it('sends confirmed / reminder / cancellation with distinct idempotency keys', async () => {
    setApiKey('re_test_key');
    await sendAppointmentConfirmed(sample);
    await sendAppointmentReminder(sample);
    await sendAppointmentCancellation(sample, 'Imprevisto');
    expect(sendMock).toHaveBeenCalledTimes(3);
    const keys = sendMock.mock.calls.map(
      (call) => (call[1] as { idempotencyKey: string }).idempotencyKey
    );
    expect(new Set(keys).size).toBe(3);
    const cancelHtml = (sendMock.mock.calls[2] as [{ html: string }])[0].html;
    expect(cancelHtml).toContain('Imprevisto');
  });

  it('sends contact form notification to admin', async () => {
    setApiKey('re_test_key');
    const result = await sendContactFormNotification('Ana', 'ana@example.com', 'Hola');
    expect(result.success).toBe(true);
    const [payload] = sendMock.mock.calls[0] as [{ to: string; html: string }];
    expect(payload.to).toBe('portadoradeeros@gmail.com');
    expect(payload.html).toContain('Hola');
  });

  it('escapes user input in HTML', async () => {
    setApiKey('re_test_key');
    await sendAppointmentConfirmation({ ...sample, clientName: '<script>alert(1)</script>' });
    const [payload] = sendMock.mock.calls[0] as [{ html: string }];
    expect(payload.html).not.toContain('<script>');
    expect(payload.html).toContain('&lt;script&gt;');
  });

  it('returns failure when resend reports an error', async () => {
    setApiKey('re_test_key');
    sendMock.mockResolvedValueOnce({ data: null, error: { message: 'rejected' } });
    const result = await sendAppointmentReminder(sample);
    expect(result.success).toBe(false);
  });

  it('builds stable idempotency keys per purpose', () => {
    const a = buildIdempotencyKey('confirmado', sample);
    const b = buildIdempotencyKey('confirmado', sample);
    const c = buildIdempotencyKey('cancelado', sample);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  /* H3 hardening — structured logger instead of raw console.error (F4-refresh 2026-10-07) */

  it('logs "credentials missing" through the structured logger (warn, observable)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      setApiKey(undefined);
      const result = await sendAppointmentConfirmation(sample);
      expect(result.success).toBe(false);

      expect(errorSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const out = String(warnSpy.mock.calls[0]?.[0]);
      expect(out).toContain('[WARN]');
      expect(out).toContain('Resend credentials missing');
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('logs send failures through the structured logger (error + provider context)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      setApiKey('re_test_key');
      sendMock.mockResolvedValueOnce({ data: null, error: { message: 'rejected by API' } });
      const result = await sendAppointmentReminder(sample);
      expect(result.success).toBe(false);

      expect(errorSpy).toHaveBeenCalledTimes(1);
      const out = String(errorSpy.mock.calls[0]?.[0]);
      expect(out).toContain('[ERROR]');
      expect(out).toContain('Error sending Resend email');
      // structured context must carry the provider + failure detail
      expect(out).toContain('provider');
      expect(out).toContain('resend');
      expect(out).toContain('rejected by API');
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('logs transport throws through the structured logger (error + provider context)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      setApiKey('re_test_key');
      sendMock.mockRejectedValueOnce(new Error('network down'));
      const result = await sendAppointmentReminder(sample);
      expect(result.success).toBe(false);

      expect(errorSpy).toHaveBeenCalledTimes(1);
      const out = String(errorSpy.mock.calls[0]?.[0]);
      expect(out).toContain('[ERROR]');
      expect(out).toContain('network down');
    } finally {
      vi.restoreAllMocks();
    }
  });
});
