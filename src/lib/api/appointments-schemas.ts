import { z } from 'zod';

import { HONEYPOT_FIELD } from '@/lib/spam-protection';

/**
 * H3 hardening (F4-refresh 2026-10-07): server-side zod validation for the
 * public booking server action payload. Until now the payload was validated
 * client-side only, so the free-text fields that land in the email SUBJECT
 * (`Nuevo turno solicitado: ${service} — ${clientName}`, see
 * src/lib/email/{smtp,resend}.ts) arrived unbounded and untrimmed.
 *
 * Caps mirror the contact route schema (name ≤ 300 = full name + surname,
 * service/subject fields ≤ 200, notes ≤ 5000, phone ≤ 50). CRLF header
 * injection is already neutralized by nodemailer/Resend internally (verified
 * empirically by 34-auditor), so this is payload bounding + normalization,
 * not a fix for an exploitable vuln.
 *
 * `appointmentDate` is a strict `z.date()`: server actions deserialize Date
 * instances natively, so a string here means a hand-crafted request, never
 * a legitimate client.
 *
 * This module deliberately has NO `'use server'` directive and lives outside
 * `appointments.ts`: a "use server" file may only export async functions,
 * and a zod schema is a value export. Keeping the schema here lets tests and
 * future callers import it directly without touching the server-actions
 * contract of `appointments.ts`.
 */
export const appointmentSchema = z.object({
  serviceId: z.string().max(100),
  serviceName: z.string().trim().min(1).max(200),
  serviceDurationMinutes: z.number().finite().positive().max(1440).optional(),
  clientName: z.string().trim().min(1).max(300),
  clientEmail: z.email('Email inválido').max(320),
  clientPhone: z.string().trim().max(50).optional(),
  appointmentDate: z.date(),
  notes: z.string().trim().max(5000).optional(),
  [HONEYPOT_FIELD]: z.string().optional(),
});
