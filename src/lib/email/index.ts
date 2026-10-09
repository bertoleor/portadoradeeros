import * as resend from './resend';
import * as smtp from './smtp';

import type { AppointmentEmailData, EmailResult } from './resend';

// Email provider dispatcher.
//
// EMAIL_PROVIDER=resend (default) → Resend API (existing behavior).
// EMAIL_PROVIDER=smtp            → SMTP fallback (Gmail + app password).
// Any other value falls back to resend (fail safe: keeps verified sender).
//
// Same function names/signatures as ./resend.ts so callers only import from
// '@/lib/email' (this index) and never branch on the provider themselves.

export type EmailProvider = 'resend' | 'smtp';

export function getEmailProvider(): EmailProvider {
  return process.env.EMAIL_PROVIDER === 'smtp' ? 'smtp' : 'resend';
}

export async function sendAppointmentConfirmation(
  data: AppointmentEmailData
): Promise<EmailResult> {
  return getEmailProvider() === 'smtp'
    ? smtp.sendAppointmentConfirmation(data)
    : resend.sendAppointmentConfirmation(data);
}

export async function sendNewAppointmentNotification(
  data: AppointmentEmailData
): Promise<EmailResult> {
  return getEmailProvider() === 'smtp'
    ? smtp.sendNewAppointmentNotification(data)
    : resend.sendNewAppointmentNotification(data);
}

export async function sendContactFormNotification(
  name: string,
  email: string,
  message: string
): Promise<EmailResult> {
  return getEmailProvider() === 'smtp'
    ? smtp.sendContactFormNotification(name, email, message)
    : resend.sendContactFormNotification(name, email, message);
}

export async function sendAppointmentConfirmed(data: AppointmentEmailData): Promise<EmailResult> {
  return getEmailProvider() === 'smtp'
    ? smtp.sendAppointmentConfirmed(data)
    : resend.sendAppointmentConfirmed(data);
}

export async function sendAppointmentReminder(data: AppointmentEmailData): Promise<EmailResult> {
  return getEmailProvider() === 'smtp'
    ? smtp.sendAppointmentReminder(data)
    : resend.sendAppointmentReminder(data);
}

export async function sendAppointmentCancellation(
  data: AppointmentEmailData,
  reason?: string
): Promise<EmailResult> {
  return getEmailProvider() === 'smtp'
    ? smtp.sendAppointmentCancellation(data, reason)
    : resend.sendAppointmentCancellation(data, reason);
}
