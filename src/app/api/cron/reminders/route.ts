import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

import { sendAppointmentReminder } from '@/lib/email/resend';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Sends a 24-hour reminder to every client whose appointment is confirmed and
 * starts between 24h and 48h from now.
 *
 * Invocation (Vercel Cron — see vercel.json `crons`):
 *   "0 12 * * *"  →  GET /api/cron/reminders  (daily at 12:00 UTC / 09:00 ART)
 *
 * Manual / local trigger (requires CRON_SECRET to be set):
 *   curl http://localhost:3000/api/cron/reminders \
 *     -H "Authorization: Bearer $CRON_SECRET"
 *
 * The endpoint is server-only and uses the service-role client because a cron
 * job has no authenticated session. It selects only the columns needed to send
 * the reminder email (client email/name, appointment date, service title).
 */
export async function GET(request: NextRequest) {
  // Guard against unauthenticated invocations (fail closed). Vercel Cron sends
  // the Authorization header derived from CRON_SECRET; without a configured
  // secret the endpoint is not a legitimate cron trigger and must refuse all
  // requests rather than exposing a public email relay.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }
  const authHeader = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;
  if (authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const from = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const to = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const supabase = createServiceClient();
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(
      'id, client_name, client_email, client_phone, appointment_date, services:service_id(title)'
    )
    .eq('status', 'confirmed')
    .gte('appointment_date', from.toISOString())
    .lte('appointment_date', to.toISOString());

  if (error) {
    console.error('Failed to fetch upcoming appointments for reminders:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const appointment of appointments ?? []) {
    const serviceTitle = Array.isArray(appointment.services)
      ? (appointment.services[0]?.title ?? 'tu sesión')
      : ((appointment.services as { title?: string } | null)?.title ?? 'tu sesión');

    const date = new Date(appointment.appointment_date);
    const formattedDate = new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Argentina/Buenos_Aires',
    }).format(date);

    try {
      const result = await sendAppointmentReminder({
        clientName: appointment.client_name,
        clientEmail: appointment.client_email,
        clientPhone: appointment.client_phone ?? '',
        service: serviceTitle,
        date: formattedDate.split(' a las ')[0],
        time: formattedDate.split(' a las ')[1] ?? '',
        price: 0,
      });

      if (result.success) {
        sent += 1;
      } else {
        failed += 1;
        console.error(`Reminder failed for appointment ${appointment.id}:`, result.error);
      }
    } catch (emailError) {
      failed += 1;
      console.error(`Reminder error for appointment ${appointment.id}:`, emailError);
    }
  }

  return NextResponse.json({ sent, failed, total: appointments?.length ?? 0 });
}
