import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMailMock = vi.fn();

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: sendMailMock })),
  },
  createTransport: vi.fn(() => ({ sendMail: sendMailMock })),
}));

// NOTE (TDD RED): '@/lib/email/smtp' does not exist yet — these imports must
// fail until the SMTP fallback transport is implemented. No real emails are
// ever sent: the nodemailer transport is fully mocked.
import {
  resetSmtpTransportForTests,
  sendAppointmentCancellation,
  sendAppointmentConfirmation,
  sendAppointmentConfirmed,
  sendAppointmentReminder,
  sendContactFormNotification,
  sendNewAppointmentNotification,
  type AppointmentEmailData,
} from '@/lib/email/smtp';

const sample: AppointmentEmailData = {
  clientName: 'Juana Pérez',
  clientEmail: 'juana@example.com',
  clientPhone: '+549****5678',
  service: 'Sesión individual',
  date: '2026-09-20',
  time: '16:00',
  price: 50000,
};

function setSmtpEnv(): void {
  process.env.SMTP_HOST = 'smtp.gmail.com';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'test@gmail.com';
  process.env.SMTP_PASS = 'test-app-password';
  resetSmtpTransportForTests();
}

function clearSmtpEnv(): void {
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_PORT;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
  resetSmtpTransportForTests();
}

describe('email/smtp fallback (nodemailer mocked, never sends real mail)', () => {
  beforeEach(() => {
    sendMailMock.mockReset();
    sendMailMock.mockResolvedValue({ messageId: 'smtp-123' });
  });

  it('returns not-configured when SMTP env vars are missing', async () => {
    clearSmtpEnv();
    const result = await sendAppointmentConfirmation(sample);
    expect(result).toEqual({ success: false, error: 'SMTP not configured' });
    expect(sendMailMock).not.toHaveBeenCalled();
    setSmtpEnv();
  });

  it('sends confirmation to the client with expected from/to/subject', async () => {
    setSmtpEnv();
    const result = await sendAppointmentConfirmation(sample);
    expect(result).toEqual({ success: true, id: 'smtp-123' });
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const [payload] = sendMailMock.mock.calls[0] as [
      { from: string; to: string; subject: string; html: string },
    ];
    expect(payload.to).toBe('juana@example.com');
    expect(payload.subject).toContain('solicitud de turno');
    expect(payload.html).toContain('Juana P');
  });

  it('sends admin notification to ADMIN_EMAIL', async () => {
    setSmtpEnv();
    await sendNewAppointmentNotification(sample);
    const [payload] = sendMailMock.mock.calls[0] as [{ to: string }];
    expect(payload.to).toBe('portadoradeeros@gmail.com');
  });

  it('sends confirmed / reminder / cancellation with distinct subjects', async () => {
    setSmtpEnv();
    await sendAppointmentConfirmed(sample);
    await sendAppointmentReminder(sample);
    await sendAppointmentCancellation(sample, 'Imprevisto');
    expect(sendMailMock).toHaveBeenCalledTimes(3);
    const subjects = sendMailMock.mock.calls.map(
      (call) => (call[0] as { subject: string }).subject
    );
    expect(new Set(subjects).size).toBe(3);
    const cancelHtml = (sendMailMock.mock.calls[2] as [{ html: string }])[0].html;
    expect(cancelHtml).toContain('Imprevisto');
  });

  it('sends contact form notification to admin', async () => {
    setSmtpEnv();
    const result = await sendContactFormNotification('Ana', 'ana@example.com', 'Hola');
    expect(result.success).toBe(true);
    const [payload] = sendMailMock.mock.calls[0] as [{ to: string; html: string }];
    expect(payload.to).toBe('portadoradeeros@gmail.com');
    expect(payload.html).toContain('Hola');
  });

  it('escapes user input in HTML', async () => {
    setSmtpEnv();
    await sendAppointmentConfirmation({ ...sample, clientName: '<script>alert(1)</script>' });
    const [payload] = sendMailMock.mock.calls[0] as [{ html: string }];
    expect(payload.html).not.toContain('<script>');
    expect(payload.html).toContain('&lt;script&gt;');
  });

  it('returns failure when the SMTP transport throws', async () => {
    setSmtpEnv();
    sendMailMock.mockRejectedValueOnce(new Error('connection refused'));
    const result = await sendAppointmentReminder(sample);
    expect(result.success).toBe(false);
  });
});
