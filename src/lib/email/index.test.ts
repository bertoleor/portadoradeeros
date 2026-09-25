import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  resendConfirmationMock,
  resendReminderMock,
  resendCancellationMock,
  smtpConfirmationMock,
  smtpReminderMock,
  smtpCancellationMock,
} = vi.hoisted(() => ({
  resendConfirmationMock: vi.fn(),
  resendReminderMock: vi.fn(),
  resendCancellationMock: vi.fn(),
  smtpConfirmationMock: vi.fn(),
  smtpReminderMock: vi.fn(),
  smtpCancellationMock: vi.fn(),
}));

vi.mock('@/lib/email/resend', () => ({
  sendAppointmentConfirmation: resendConfirmationMock,
  sendAppointmentReminder: resendReminderMock,
  sendAppointmentCancellation: resendCancellationMock,
}));

vi.mock('@/lib/email/smtp', () => ({
  sendAppointmentConfirmation: smtpConfirmationMock,
  sendAppointmentReminder: smtpReminderMock,
  sendAppointmentCancellation: smtpCancellationMock,
}));

// NOTE (TDD RED): '@/lib/email/index' does not exist yet — these imports must
// fail until the EMAIL_PROVIDER dispatcher is implemented.
import {
  getEmailProvider,
  sendAppointmentCancellation,
  sendAppointmentConfirmation,
  sendAppointmentReminder,
} from '@/lib/email/index';

const sample = {
  clientName: 'Juana Pérez',
  clientEmail: 'juana@example.com',
  clientPhone: '+549****5678',
  service: 'Sesión individual',
  date: '2026-09-20',
  time: '16:00',
  price: 50000,
};

describe('email provider dispatcher (EMAIL_PROVIDER=resend|smtp)', () => {
  beforeEach(() => {
    for (const mock of [
      resendConfirmationMock,
      resendReminderMock,
      resendCancellationMock,
      smtpConfirmationMock,
      smtpReminderMock,
      smtpCancellationMock,
    ]) {
      mock.mockReset();
      mock.mockResolvedValue({ success: true, id: 'mock-id' });
    }
    delete process.env.EMAIL_PROVIDER;
  });

  it('defaults to resend when EMAIL_PROVIDER is unset', () => {
    expect(getEmailProvider()).toBe('resend');
  });

  it('routes confirmation to resend by default', async () => {
    await sendAppointmentConfirmation(sample);
    expect(resendConfirmationMock).toHaveBeenCalledTimes(1);
    expect(smtpConfirmationMock).not.toHaveBeenCalled();
  });

  it('routes confirmation / reminder / cancellation to smtp when EMAIL_PROVIDER=smtp', async () => {
    process.env.EMAIL_PROVIDER = 'smtp';
    await sendAppointmentConfirmation(sample);
    await sendAppointmentReminder(sample);
    await sendAppointmentCancellation(sample, 'Motivo');
    expect(smtpConfirmationMock).toHaveBeenCalledTimes(1);
    expect(smtpReminderMock).toHaveBeenCalledTimes(1);
    expect(smtpCancellationMock).toHaveBeenCalledTimes(1);
    expect(resendConfirmationMock).not.toHaveBeenCalled();
    expect(resendReminderMock).not.toHaveBeenCalled();
    expect(resendCancellationMock).not.toHaveBeenCalled();
  });

  it('falls back to resend for unknown EMAIL_PROVIDER values', () => {
    process.env.EMAIL_PROVIDER = 'carrier-pigeon';
    expect(getEmailProvider()).toBe('resend');
  });
});
