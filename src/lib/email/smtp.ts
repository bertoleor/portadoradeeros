import { createTransport, type SentMessageInfo, type Transporter } from 'nodemailer';

import { logger } from '@/lib/logger';

import type { AppointmentEmailData, EmailResult } from './resend';

export type { AppointmentEmailData, EmailResult } from './resend';

// SMTP fallback transport (Gmail + app password).
//
// - Selected via EMAIL_PROVIDER=smtp (see ./index.ts). Default stays Resend.
// - Same exported interface + subjects as ./resend.ts so callers can switch
//   provider without code changes.
// - NEVER commit credentials: host/user/pass come only from env vars.
// - Tests mock 'nodemailer' — this module never sends real mail in tests.

const ADMIN_EMAIL = 'portadoradeeros@gmail.com';

function getFrom(): string {
  return (
    process.env.SMTP_FROM ??
    process.env.EMAIL_FROM ??
    'Portadora de Eros <portadoradeeros@gmail.com>'
  );
}

let transporter: Transporter<SentMessageInfo> | null = null;

function getTransporter(): Transporter<SentMessageInfo> | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    return null;
  }
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? '587');
    transporter = createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return transporter;
}

/** Test helper: drop the cached transporter between tests. */
export function resetSmtpTransportForTests(): void {
  transporter = null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layout(title: string, heading: string, introHtml: string, detailsHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background-color:#f5f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a1a1a;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f4f0;padding:48px 20px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
<tr><td align="center" style="padding-bottom:32px;"><p style="margin:0;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#999999;">Portadora de Eros</p></td></tr>
<tr><td style="background-color:#ffffff;border-radius:24px;overflow:hidden;">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:4px;background:#e8d5c4;"></td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:48px 40px 40px;">
<h1 style="margin:0 0 12px;font-size:26px;font-weight:300;letter-spacing:-0.02em;color:#1a1a1a;text-align:center;">${escapeHtml(heading)}</h1>
<p style="margin:0 0 36px;font-size:15px;line-height:1.7;color:#777777;text-align:center;">${introHtml}</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f7f4;border-radius:16px;margin-bottom:36px;"><tr><td style="padding:28px 32px;">${detailsHtml}</td></tr></table>
<p style="margin:0;font-size:12px;line-height:1.6;color:#aaaaaa;text-align:center;">Portadora de Eros &middot; Este es un mensaje autom&aacute;tico, por favor no lo respondas.</p>
</td></tr></table>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function detailRow(label: string, value: string): string {
  return `<p style="margin:0 0 8px;font-size:14px;color:#777777;">${escapeHtml(label)}: <strong style="color:#1a1a1a;font-weight:500;">${escapeHtml(value)}</strong></p>`;
}

function appointmentDetails(data: AppointmentEmailData, extra?: string): string {
  const rows = [
    detailRow('Servicio', data.service),
    detailRow('Fecha', data.date),
    detailRow('Hora', data.time),
  ];
  if (extra) {
    rows.push(detailRow('Motivo', extra));
  }
  return rows.join('');
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(args: SendArgs): Promise<EmailResult> {
  const tx = getTransporter();
  if (!tx) {
    logger.warn('SMTP credentials missing', { provider: 'smtp' });
    return { success: false, error: 'SMTP not configured' };
  }
  try {
    const info = await tx.sendMail({
      from: getFrom(),
      to: args.to,
      subject: args.subject,
      html: args.html,
    });
    return { success: true, id: info?.messageId };
  } catch (error) {
    logger.error('Error sending SMTP email', {
      provider: 'smtp',
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error };
  }
}

// "Request received" confirmation to the client when they book a turno
// (pending admin confirmation).
export async function sendAppointmentConfirmation(
  data: AppointmentEmailData
): Promise<EmailResult> {
  return sendEmail({
    to: data.clientEmail,
    subject: 'Recibimos tu solicitud de turno — Portadora de Eros',
    html: layout(
      'Solicitud recibida',
      'Recibimos tu solicitud',
      `Hola <strong style="color:#1a1a1a;font-weight:500;">${escapeHtml(data.clientName)}</strong>, tu solicitud est&aacute; pendiente de confirmaci&oacute;n. Te avisaremos cuando sea confirmada.`,
      appointmentDetails(data)
    ),
  });
}

// Notification to the admin when a new appointment is requested.
export async function sendNewAppointmentNotification(
  data: AppointmentEmailData
): Promise<EmailResult> {
  const summary = `${data.service} — ${data.clientName} (${data.clientPhone})`;
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `Nuevo turno solicitado: ${data.service} — ${data.clientName}`,
    html: layout(
      'Nuevo turno solicitado',
      'Nuevo turno solicitado',
      'Se registr&oacute; una nueva solicitud de turno con los siguientes datos:',
      appointmentDetails({ ...data, service: summary })
    ),
  });
}

// Contact form notification to the admin.
export async function sendContactFormNotification(
  name: string,
  email: string,
  message: string
): Promise<EmailResult> {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `Contacto web: ${name}`,
    html: layout(
      'Nuevo mensaje de contacto',
      'Nuevo mensaje de contacto',
      `De <strong style="color:#1a1a1a;font-weight:500;">${escapeHtml(name)}</strong> (${escapeHtml(email)}):`,
      `<p style="margin:0;font-size:14px;line-height:1.7;color:#1a1a1a;">${escapeHtml(message)}</p>`
    ),
  });
}

// Direct confirmation to the client (when the admin confirms).
export async function sendAppointmentConfirmed(data: AppointmentEmailData): Promise<EmailResult> {
  return sendEmail({
    to: data.clientEmail,
    subject: 'Tu turno está confirmado — Portadora de Eros',
    html: layout(
      'Turno confirmado',
      'Tu turno está confirmado',
      `Hola <strong style="color:#1a1a1a;font-weight:500;">${escapeHtml(data.clientName)}</strong>, tu sesi&oacute;n fue reservada con &eacute;xito.`,
      appointmentDetails(data)
    ),
  });
}

// Reminder to the client.
export async function sendAppointmentReminder(data: AppointmentEmailData): Promise<EmailResult> {
  return sendEmail({
    to: data.clientEmail,
    subject: 'Recordatorio de tu turno — Portadora de Eros',
    html: layout(
      'Recordatorio de turno',
      'Te recordamos tu turno',
      `Hola <strong style="color:#1a1a1a;font-weight:500;">${escapeHtml(data.clientName)}</strong>, te esperamos en tu pr&oacute;xima sesi&oacute;n.`,
      appointmentDetails(data)
    ),
  });
}

// Cancellation notice to the client.
export async function sendAppointmentCancellation(
  data: AppointmentEmailData,
  reason?: string
): Promise<EmailResult> {
  return sendEmail({
    to: data.clientEmail,
    subject: 'Tu turno fue cancelado — Portadora de Eros',
    html: layout(
      'Turno cancelado',
      'Tu turno fue cancelado',
      `Hola <strong style="color:#1a1a1a;font-weight:500;">${escapeHtml(data.clientName)}</strong>, lamentamos informarte que tu turno fue cancelado. Escribinos para reprogramar.`,
      appointmentDetails(data, reason)
    ),
  });
}
