'use server';

import webPush from 'web-push';

import { AppError, fail, ok, type Result } from '@/lib/api/error';
import { getAdminSettings } from '@/lib/api/settings';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import {
  sendAppointmentCancellation,
  sendAppointmentConfirmation,
  sendAppointmentConfirmed,
  sendNewAppointmentNotification,
} from '@/lib/email';
import {
  checkRateLimit,
  HONEYPOT_FIELD,
  isHoneypotTriggered,
  SPAM_RATE_LIMIT,
} from '@/lib/spam-protection';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { headers } from 'next/headers';

import type { Database } from '@/types/database';

type AppointmentRow = Database['public']['Tables']['appointments']['Row'];

/**
 * Default slot duration (minutes) assumed for an appointment when the linked
 * service has no duration configured. Mirrors the fallback already used by
 * `getBookedSlots` and `checkSlotAvailability` for the admin path.
 */
const DEFAULT_SERVICE_DURATION_MIN = 60;

/**
 * Resolve the duration of the service being booked. Server actions cannot
 * pass the admin-only `services` read down to the client, and the public
 * booking form already knows the duration it rendered the calendar with, so
 * the form passes `serviceDurationMinutes` alongside the payload. When
 * absent (older callers / tests) we fall back to the standard 60-minute
 * slot — the same default the availability helpers use — so the overlap
 * window is never shorter than the slot the calendar promised.
 */
function resolveServiceDuration(payload: {
  serviceDurationMinutes?: number;
  serviceName: string;
}): number {
  const raw = payload.serviceDurationMinutes;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return Math.ceil(raw);
  }
  return DEFAULT_SERVICE_DURATION_MIN;
}

/**
 * Normalize a phone number to a consistent format for dedupe and lookup:
 * strips everything that is not a digit (spaces, dashes, parentheses) and keeps
 * the leading `+` (country code marker) if present. Applied consistently when
 * storing a phone (clients insert/update) and when matching by phone, so an
 * exact `.eq(phone, ...)` lookup is robust against formatting differences.
 */
function normalizePhone(input: string): string {
  return input.trim().replace(/[^\d+]/g, '');
}

// Web-Push VAPID configuration
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    'mailto:portadoradeeros@gmail.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/**
 * Sends a push notification to all registered admin devices
 */
async function sendPushToAdmins(payload: { title: string; body: string; url?: string }) {
  try {
    // Scoped service-role client (D-SEC-2): `push_subscriptions` RLS is
    // `auth.uid() = admin_id`, which anon cannot satisfy. The privileged client
    // bypasses RLS so the public booking flow can still broadcast to admin
    // devices. It selects ONLY push-subscription rows (endpoint/keys) — never PII.
    const supabase = createAdminClient();
    const { data: subs, error } = await supabase.from('push_subscriptions').select('*');

    if (error || !subs) {
      return;
    }

    const pushPromises = subs.map(
      (sub: { id: string; endpoint: string; p256dh: string; auth: string }) => {
        const pushConfig = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        return webPush.sendNotification(pushConfig, JSON.stringify(payload)).catch((err) => {
          // If 410 Gone or 404, the subscription is expired/invalid
          if (err.statusCode === 410 || err.statusCode === 404) {
            return supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
          console.error('Push error for sub:', sub.id, err);
        });
      }
    );

    await Promise.all(pushPromises);
  } catch (err) {
    console.error('Error in sendPushToAdmins:', err);
  }
}

interface AppointmentPayload {
  serviceId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  appointmentDate: Date;
  notes?: string;
  serviceName: string; // for email only
  serviceDurationMinutes?: number; // overlap window (defaults to 60)
  [HONEYPOT_FIELD]?: string;
}

const RATE_LIMIT_SCOPE = 'appointments';

/**
 * Resolve the client IP for a server action from request headers. Server
 * actions don't receive a `Request`, so we read the forwarding headers via
 * `next/headers`. Falls back to a shared `unknown` bucket when absent (local
 * dev). The email here is the real spam surface: a public form that mails the
 * admin with no throttle is an open relay, so the check must live where the
 * side-effect happens, not only in the (currently unused) `/api` route.
 */
async function resolveActionClientIp(): Promise<string> {
  try {
    const headerStore = await headers();
    const forwarded = headerStore.get('x-forwarded-for');
    if (forwarded) {
      const first = forwarded.split(',')[0];
      if (first !== undefined && first.trim().length > 0) {
        return first.trim();
      }
    }
    const realIp = headerStore.get('x-real-ip');
    if (realIp && realIp.trim().length > 0) {
      return realIp.trim();
    }
  } catch {
    // `headers()` may throw outside a request context (e.g. tests); treat as unknown.
  }
  return 'unknown';
}

export async function createAppointment(
  payload: AppointmentPayload
): Promise<Result<AppointmentRow>> {
  // HONEYPOT — bots that populate the hidden field must not trigger any email
  // or DB write. We still return a successful-looking result so the caller's
  // UI (and any bot) can't tell it was caught.
  // HISTÓRICO: the key here is HONEYPOT_FIELD (the fixed string 'company_website',
  // see src/lib/spam-protection.ts), never derived from input. An attacker
  // controls the VALUE at that key, not the key name, so there is no path to
  // reach a prototype shadow such as __proto__/constructor — no injection.
  // eslint-disable-next-line security/detect-object-injection
  if (isHoneypotTriggered(payload[HONEYPOT_FIELD])) {
    return ok({
      id: 'honeypot',
      service_id: null,
      client_name: payload.clientName,
      client_email: payload.clientEmail,
      client_phone: payload.clientPhone ?? null,
      appointment_date: payload.appointmentDate.toISOString(),
      notes: payload.notes ?? null,
      status: 'pending',
    } as AppointmentRow);
  }

  // RATE LIMIT — cap this public write+email flow per IP.
  const ip = await resolveActionClientIp();
  const rate = checkRateLimit(RATE_LIMIT_SCOPE, ip, SPAM_RATE_LIMIT);
  if (rate.limited) {
    return fail(
      new AppError('VALIDATION', 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.')
    );
  }

  // OVERLAP GUARD (ORN-173) — the public path must honor the same
  // anti-overbooking contract as the admin path: a proposed slot that
  // collides with any existing non-cancelled appointment is rejected
  // BEFORE any side effect (DB write, emails, push). `checkSlotAvailability`
  // reads non-PII columns through the service-role client, filters cancelled
  // rows server-side and FAILS CLOSED on query errors, so a broken
  // availability read can never admit a double booking.
  const durationMin = resolveServiceDuration(payload);
  const availability = await checkSlotAvailability(payload.appointmentDate, durationMin);
  if (!availability.available) {
    return fail(
      new AppError(
        'VALIDATION',
        'Ese horario acaba de ocuparse. Por favor elegí otro horario disponible.'
      )
    );
  }

  const supabase = await createClient();

  // 1. Insert into Supabase 'appointments' table
  const { data: dbData, error: dbError } = await supabase
    .from('appointments')
    .insert([
      {
        service_id: payload.serviceId || null,
        client_name: payload.clientName,
        client_email: payload.clientEmail,
        client_phone: payload.clientPhone || null,
        appointment_date: payload.appointmentDate.toISOString(),
        notes: payload.notes || null,
        status: 'pending',
      },
    ])
    .select()
    .single();

  if (dbError) {
    console.error('Failed to create appointment in Supabase:', dbError);
    return fail(new AppError('DB', 'Hubo un error al registrar el turno en la base de datos.'));
  }

  // 2. Fetch settings
  const settings = await getAdminSettings();
  const bankDetails = settings?.bankDetails || {
    bankOwner: 'Jacqueline',
    bankName: 'Mercado Pago',
    cbu: 'No configurado',
    alias: 'PORTADORA.EROS',
  };

  // 3. Notify
  await sendBookingEmails(payload, bankDetails);

  // 3. Push
  void sendPushToAdmins({
    title: 'Nuevo turno ✨',
    body: `${payload.clientName} agendó ${payload.serviceName}.`,
    url: '/admin',
  });

  return ok(dbData);
}

async function sendBookingEmails(
  payload: AppointmentPayload,
  bankDetails: {
    bankOwner: string;
    bankName: string;
    cbu: string;
    alias: string;
  }
) {
  const formattedDate = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(payload.appointmentDate);

  const emailData = {
    clientName: payload.clientName,
    clientEmail: payload.clientEmail,
    clientPhone: payload.clientPhone || '',
    service: payload.serviceName,
    date: formattedDate.split(' a las ')[0], // Best effort to split date and time
    time: formattedDate.split(' a las ')[1] || '',
    price: 0, // Not used in templates currently
    bankDetails: {
      bankName: bankDetails.bankName,
      accountType: 'Transferencia',
      accountNumber: bankDetails.cbu,
      cbu: bankDetails.cbu,
      alias: bankDetails.alias,
    },
  };

  try {
    // Email to Admin
    await sendNewAppointmentNotification(emailData);

    // Email to Client
    await sendAppointmentConfirmation(emailData);
  } catch (err) {
    console.error('Email error:', err);
  }
}

export async function getAppointments() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('appointments')
    .select(
      `
      *,
      services ( title, price )
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch appointments:', error);
    return [];
  }

  return data;
}

export async function getBookedSlots(dateStr: string, durationMinutes = 60) {
  const supabase = createServiceClient();

  // Fetch appointments for the given date with service duration.
  // Privileged (service-role) read: RLS now denies anon SELECT on
  // `appointments` (Slice 1), so the public booking form must source
  // availability from a server-only path that selects ONLY non-PII columns.
  const { data, error } = await supabase
    .from('appointments')
    .select('appointment_date, service_id, services:service_id(duration)')
    .filter('appointment_date', 'gte', `${dateStr}T00:00:00Z`)
    .filter('appointment_date', 'lte', `${dateStr}T23:59:59Z`)
    .neq('status', 'cancelled');

  if (error) {
    throw new AppError('DB', `Failed to fetch booked slots: ${error.message}`);
  }

  // Generate all time slots that would be occupied based on duration
  const occupiedSlots: string[] = [];

  for (const app of data ?? []) {
    const startDate = new Date(app.appointment_date);
    const duration = (app.services as { duration?: number } | null)?.duration || durationMinutes;

    // Generate slots every 15 minutes for the duration of the appointment
    const slotsCount = Math.ceil(duration / 15);
    for (let i = 0; i < slotsCount; i++) {
      const slotTime = new Date(startDate.getTime() + i * 15 * 60 * 1000);
      const timeStr = `${slotTime.getUTCHours().toString().padStart(2, '0')}:${slotTime.getUTCMinutes().toString().padStart(2, '0')}`;
      if (!occupiedSlots.includes(timeStr)) {
        occupiedSlots.push(timeStr);
      }
    }
  }

  return occupiedSlots.sort((a, b) => a.localeCompare(b));
}

export async function confirmAppointment(appointmentId: string): Promise<Result<{ id: string }>> {
  await requireAdmin();

  const supabase = await createClient();

  // 1. Fetch current appointment
  const { data: appointment, error: fetchError } = await supabase
    .from('appointments')
    .select('*, services:service_id(title)')
    .eq('id', appointmentId)
    .single();

  if (fetchError || !appointment) {
    console.error('Failed to fetch appointment:', fetchError);
    throw new AppError('NOT_FOUND', 'No se pudo obtener el turno.');
  }

  // 2. Update status to confirmed
  const { error: updateError } = await supabase
    .from('appointments')
    .update({ status: 'confirmed' })
    .eq('id', appointmentId);

  if (updateError) {
    console.error('Failed to update appointment status:', updateError);
    throw new AppError('DB', 'Ocurrió un error al actualizar el estado.');
  }

  // 3. Send Confirmed Email to Client
  const formattedDate = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(appointment.appointment_date));

  const serviceName = appointment.services?.title || 'tu sesión';

  try {
    await sendAppointmentConfirmed({
      clientName: appointment.client_name,
      clientEmail: appointment.client_email,
      clientPhone: appointment.client_phone || '',
      service: serviceName,
      date: formattedDate.split(' a las ')[0],
      time: formattedDate.split(' a las ')[1] || '',
      price: 0,
    });
  } catch (emailError) {
    console.error('Failed to send Confirmed email:', emailError);
  }

  return ok({ id: appointmentId });
}

// Complete an appointment (mark as completed after session)
export async function completeAppointment(appointmentId: string): Promise<Result<{ id: string }>> {
  await requireAdmin();

  const supabase = await createClient();

  // 1. Fetch current appointment
  const { data: appointment, error: fetchError } = await supabase
    .from('appointments')
    .select('*, services:service_id(title)')
    .eq('id', appointmentId)
    .single();

  if (fetchError || !appointment) {
    console.error('Failed to fetch appointment:', fetchError);
    throw new AppError('NOT_FOUND', 'No se pudo obtener el turno.');
  }

  // 2. Update status to completed
  const { error: updateError } = await supabase
    .from('appointments')
    .update({ status: 'completed' })
    .eq('id', appointmentId);

  if (updateError) {
    console.error('Failed to update appointment status:', updateError);
    throw new AppError('DB', 'Ocurrió un error al actualizar el estado.');
  }

  return ok({ id: appointmentId });
}

// Cancel an appointment
export async function cancelAppointment(
  appointmentId: string,
  reason?: string
): Promise<Result<{ id: string }>> {
  await requireAdmin();

  const supabase = await createClient();

  // 1. Fetch current appointment
  const { data: appointment, error: fetchError } = await supabase
    .from('appointments')
    .select('*, services:service_id(title)')
    .eq('id', appointmentId)
    .single();

  if (fetchError || !appointment) {
    console.error('Failed to fetch appointment:', fetchError);
    throw new AppError('NOT_FOUND', 'No se pudo obtener el turno.');
  }

  // 2. Update status to cancelled
  const { error: updateError } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId);

  if (updateError) {
    console.error('Failed to update appointment status:', updateError);
    throw new AppError('DB', 'Ocurrió un error al cancelar el turno.');
  }

  // 3. Send Cancellation Email to Client
  const formattedDate = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(appointment.appointment_date));

  const serviceName = appointment.services?.title || 'tu sesión';

  try {
    await sendAppointmentCancellation(
      {
        clientName: appointment.client_name,
        clientEmail: appointment.client_email,
        clientPhone: appointment.client_phone || '',
        service: serviceName,
        date: formattedDate.split(' a las ')[0],
        time: formattedDate.split(' a las ')[1] || '',
        price: 0,
      },
      reason
    );
  } catch (emailError) {
    console.error('Failed to send Cancellation email:', emailError);
  }

  return ok({ id: appointmentId });
}

export async function getContactMessages() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching contact messages:', error.message);
    return [];
  }

  return data;
}

export async function updateContactStatus(
  id: string,
  status: 'read' | 'archived'
): Promise<Result<{ id: string }>> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id);

  if (error) {
    throw new AppError('DB', error.message);
  }
  return ok({ id });
}

// ─────────────────────────────────────────────────────────────────────────────
// SMART COLLISION DETECTION
// Checks whether a proposed [startTime, startTime + durationMin] window
// overlaps any existing appointment on the same day.
// ─────────────────────────────────────────────────────────────────────────────
export async function checkSlotAvailability(
  proposedStart: Date,
  durationMin: number,
  excludeId?: string
): Promise<{ available: boolean }> {
  // Privileged (service-role) read of non-PII columns only. RLS denies anon
  // SELECT on `appointments` (Slice 1), so availability must be resolved
  // server-side without exposing client_name/client_email/client_phone.
  const supabase = createServiceClient();

  const dayStart = new Date(proposedStart);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(proposedStart);
  dayEnd.setHours(23, 59, 59, 999);

  let query = supabase
    .from('appointments')
    .select('appointment_date, service_id, services:service_id(duration)')
    .gte('appointment_date', dayStart.toISOString())
    .lte('appointment_date', dayEnd.toISOString())
    .neq('status', 'cancelled');

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;
  if (error) {
    // FAIL CLOSED: a query error must never let a slot be reported as free.
    console.error('checkSlotAvailability query failed:', error.message);
    return { available: false };
  }

  const proposedEnd = new Date(proposedStart.getTime() + durationMin * 60_000);

  for (const app of data ?? []) {
    const existStart = new Date(app.appointment_date);
    const existDuration: number = (app.services as { duration?: number } | null)?.duration ?? 60;
    const existEnd = new Date(existStart.getTime() + existDuration * 60_000);

    // Overlap condition: proposed start < existing end AND proposed end > existing start
    if (proposedStart < existEnd && proposedEnd > existStart) {
      return { available: false };
    }
  }

  return { available: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN-CREATED APPOINTMENT
// Skips the payment flow — sends a direct confirmation email to the client.
// ─────────────────────────────────────────────────────────────────────────────
interface AdminAppointmentPayload {
  serviceId: string;
  serviceName: string;
  serviceDuration: number;
  clientName: string; // Full name (name + surname)
  clientEmail: string;
  clientPhone?: string;
  clientId?: string; // Optional: if we already have a client
  appointmentDate: Date;
  notes?: string;
}

export async function createAppointmentAdmin(
  payload: AdminAppointmentPayload
): Promise<Result<AppointmentRow>> {
  await requireAdmin();

  // 1. Check for collisions first
  const availability = await checkSlotAvailability(
    payload.appointmentDate,
    payload.serviceDuration
  );
  if (!availability.available) {
    throw new AppError(
      'VALIDATION',
      'Ese horario se superpone con otro turno. Por favor elegí otro horario.'
    );
  }

  const supabase = await createClient();

  // 2. Find or create client
  let clientId = payload.clientId;
  if (!clientId) {
    // Parse name into first name and surname
    const nameParts = payload.clientName.split(' ');
    const firstName = nameParts[0];
    const surname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    try {
      const client = await findOrCreateClient({
        name: firstName,
        surname: surname || undefined,
        email: payload.clientEmail,
        phone: payload.clientPhone,
      });
      clientId = client.id;
    } catch (err) {
      console.error('Error finding/creating client:', err);
      // Continue without client ID if there's an error (backwards compatibility)
    }
  }

  // 3. Insert with status 'confirmed' directly (admin-created = already confirmed)
  const { data: dbData, error: dbError } = await supabase
    .from('appointments')
    .insert([
      {
        service_id: payload.serviceId || null,
        client_id: clientId || null, // Link to clients table
        client_name: payload.clientName, // Keep for backwards compatibility
        client_email: payload.clientEmail,
        client_phone: payload.clientPhone || null,
        appointment_date: payload.appointmentDate.toISOString(),
        notes: payload.notes || null,
        status: 'confirmed',
      },
    ])
    .select()
    .single();

  if (dbError) {
    throw new AppError('DB', 'Error al registrar el turno.');
  }

  // 3. Send confirmation email to client
  const formattedDate = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(payload.appointmentDate);

  try {
    await sendAppointmentConfirmed({
      clientName: payload.clientName,
      clientEmail: payload.clientEmail,
      clientPhone: payload.clientPhone || '',
      service: payload.serviceName,
      date: formattedDate.split(' a las ')[0],
      time: formattedDate.split(' a las ')[1] || '',
      price: 0,
    });
  } catch (emailErr) {
    console.error('Email error on admin appointment:', emailErr);
  }

  // 4. Push Notification to all admin devices
  void sendPushToAdmins({
    title: 'Nuevo turno (Manual) ✨',
    body: `Turno creado para ${payload.clientName}: ${payload.serviceName}.`,
    url: '/admin',
  });

  return ok(dbData);
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENTS LIST
// Aggregates unique clients from the appointments table.
// ─────────────────────────────────────────────────────────────────────────────
export interface ClientRecord {
  email: string;
  name: string;
  phone: string | null;
  appointments: {
    id: string;
    appointment_date: string;
    status: string;
    serviceTitle: string | null;
  }[];
  lastAppointment: string;
  totalAppointments: number;
}

export async function getClients(): Promise<ClientRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('appointments')
    .select(
      'id, client_name, client_email, client_phone, appointment_date, status, services:service_id(title)'
    )
    .order('appointment_date', { ascending: false });

  if (error || !data) {
    return [];
  }

  // Group by email
  const map = new Map<string, ClientRecord>();
  for (const row of data) {
    const serviceTitle =
      (row.services as unknown as { title: string | null }[])?.[0]?.title ?? null;
    const existing = map.get(row.client_email);
    const appt = {
      id: row.id,
      appointment_date: row.appointment_date,
      status: row.status ?? 'pending', // DB column is nullable; default keeps the record well-formed
      serviceTitle,
    };
    if (existing) {
      existing.appointments.push(appt);
    } else {
      map.set(row.client_email, {
        email: row.client_email,
        name: row.client_name,
        phone: row.client_phone ?? null,
        appointments: [appt],
        lastAppointment: row.appointment_date,
        totalAppointments: 1,
      });
    }
  }

  // Recalculate totals
  const clients = Array.from(map.values()).map((c) => ({
    ...c,
    totalAppointments: c.appointments.length,
    lastAppointment: c.appointments[0]?.appointment_date ?? '',
  }));

  return clients.sort(
    (a, b) => new Date(b.lastAppointment).getTime() - new Date(a.lastAppointment).getTime()
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GET BLOCKED TIMES FOR A SPECIFIC DATE (Client Side)
// Returns times that admin has blocked for a given date
// ─────────────────────────────────────────────────────────────────────────────
export async function getBlockedTimesForDate(
  dateStr: string
): Promise<{ start: string; end: string; isAllDay: boolean }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.from('blocked_times').select('*').eq('date', dateStr);

  if (error || !data) {
    return [];
  }

  return data.map(
    (bt: { time_start: string | null; time_end: string | null; is_all_day: boolean | null }) => ({
      start: bt.time_start || '00:00',
      end: bt.time_end || '23:59',
      isAllDay: bt.is_all_day ?? false,
    })
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GET NEXT AVAILABLE SLOTS
// Returns the next N available time slots considering:
// - Business hours
// - Booked appointments
// - Blocked times by admin
// ─────────────────────────────────────────────────────────────────────────────
export interface AvailableSlot {
  date: string;
  time: string;
  datetime: string;
}

/**
 * A range of time already occupied (appointment or admin block), expressed as
 * absolute epoch-milliseconds.
 */
interface OccupiedWindow {
  start: number;
  end: number;
}

export async function getNextAvailableSlots(
  businessHours: Record<string, { closed: boolean; start: string; end: string }>,
  durationMinutes: number,
  count = 5
): Promise<AvailableSlot[]> {
  const availableSlots: AvailableSlot[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const slotDurationMs = durationMinutes * 60000;

  // Single 30-day window (no per-day queries → no N+1, P2/P5).
  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + 30);
  const windowEndDateStr = windowEnd.toISOString().split('T')[0];

  // 1. Appointments for the whole window — ONE range query on the indexed
  //    `appointment_date` column, SELECTing only non-PII columns (Slice 1
  //    denies anon reads, so this must go through the service-role client).
  const svc = createServiceClient();
  const { data: apts, error: aptErr } = await svc
    .from('appointments')
    .select('appointment_date, service_id, services:service_id(duration)')
    .gte('appointment_date', today.toISOString())
    .lte('appointment_date', `${windowEndDateStr}T23:59:59Z`)
    .neq('status', 'cancelled');

  if (aptErr) {
    throw new AppError('DB', `Failed to fetch availability: ${aptErr.message}`);
  }

  // 2. Blocked times for the whole window — ONE range query (public read).
  const anon = await createClient();
  const { data: blockedRows, error: blockedErr } = await anon
    .from('blocked_times')
    .select('*')
    .gte('date', today.toISOString().split('T')[0])
    .lte('date', windowEndDateStr);

  if (blockedErr) {
    throw new AppError('DB', `Failed to fetch blocked times: ${blockedErr.message}`);
  }

  // 3. Flatten both sources into a single in-memory occupancy list.
  const occupied: OccupiedWindow[] = [];
  for (const apt of apts ?? []) {
    const start = new Date(apt.appointment_date).getTime();
    const dur = (apt.services as { duration?: number } | null)?.duration ?? durationMinutes;
    occupied.push({ start, end: start + dur * 60000 });
  }
  for (const bt of blockedRows ?? []) {
    const dayMs = new Date(`${bt.date}T00:00:00`).getTime();
    if (bt.is_all_day === true) {
      occupied.push({ start: dayMs, end: dayMs + 24 * 60 * 60 * 1000 });
    } else if (bt.time_start && bt.time_end) {
      const [sh, sm] = bt.time_start.split(':').map(Number);
      const [eh, em] = bt.time_end.split(':').map(Number);
      occupied.push({
        start: dayMs + sh * 3600000 + sm * 60000,
        end: dayMs + eh * 3600000 + em * 60000,
      });
    }
  }

  // 4. Walk days/business-hours in memory (no DB), matching existing output.
  for (let d = 0; d < 30 && availableSlots.length < count; d++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() + d);
    const dateStr = checkDate.toISOString().split('T')[0];
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
      checkDate.getDay()
    ];
    // HISTÓRICO: `dayName` is bounded to the 7 hardcoded day-name strings above
    // (indexed by Date.getDay(), which returns 0–6). `businessHours[dayName]`
    // can therefore never be asked for an arbitrary attacker-chosen key; even
    // the matching tested by `if (!bh || bh.closed)` cannot reach a prototype
    // shadow. The object content comes from admin settings, not client input.
    // eslint-disable-next-line security/detect-object-injection
    const bh = businessHours[dayName];

    if (!bh || bh.closed) {
      continue;
    }

    const [sH, sM] = bh.start.split(':').map(Number);
    const [eH, eM] = bh.end.split(':').map(Number);
    const dayStartMs = checkDate.getTime() + sH * 3600000 + sM * 60000;
    const dayEndMs = checkDate.getTime() + eH * 3600000 + eM * 60000;

    for (
      let cur = dayStartMs;
      cur + slotDurationMs <= dayEndMs && availableSlots.length < count;
      cur += 1800000
    ) {
      if (!occupied.some((w) => cur < w.end && cur + slotDurationMs > w.start)) {
        const sd = new Date(cur);
        availableSlots.push({
          date: dateStr,
          time: `${sd.getUTCHours().toString().padStart(2, '0')}:${sd.getUTCMinutes().toString().padStart(2, '0')}`,
          datetime: sd.toISOString(),
        });
      }
    }
  }
  return availableSlots;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENTS TABLE FUNCTIONS (New)
// ─────────────────────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  surname: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ClientData {
  name: string;
  surname?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export async function findClient(phone?: string, email?: string): Promise<Client | null> {
  const supabase = await createClient();

  // Indexed lookups (D4/P1): no more "load all clients then filter in JS".
  // Email first (backed by the UNIQUE index `idx_clients_email_unique`),
  // then phone (backed by `idx_clients_phone`). `.maybeSingle()` lets us
  // distinguish "no match" (data=null, no error) from a real query failure.
  if (email) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) {
      throw new AppError('DB', `Failed to look up client by email: ${error.message}`);
    }
    if (data) {
      return data as Client;
    }
  }

  if (phone) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('phone', normalizePhone(phone))
      .maybeSingle();

    if (error) {
      throw new AppError('DB', `Failed to look up client by phone: ${error.message}`);
    }
    if (data) {
      return data as Client;
    }
  }

  return null;
}

export async function findOrCreateClient(data: ClientData): Promise<Client> {
  const supabase = await createClient();
  // Normalize phone (and email) once so both the lookup and any write use the
  // same canonical format as `findClient`'s `.eq(phone, ...)`.
  const normalizedData: ClientData = {
    ...data,
    phone: data.phone ? normalizePhone(data.phone) : undefined,
    email: data.email ? data.email.toLowerCase() : undefined,
  };
  const existing = await findClient(normalizedData.phone, normalizedData.email);

  if (existing) {
    const updates: Partial<ClientData> = {};
    const fields: (keyof ClientData)[] = ['name', 'surname', 'email', 'phone'];

    // HISTÓRICO: `field` iterates the hardcoded 4-element `fields` array above
    // (typed `keyof ClientData`), never an attacker-controlled string. So the
    // reads `normalizedData[field]` / `existing[field]` and the write
    // `updates[field]` are bounded to those 4 known model keys — cannot reach
    // __proto__/constructor. `existing`/`updates` are module-owned objects.
    // NOTE: uses disable-next-line (not a disable block) because ESLint 9 flat
    // config only honors the per-line directive here — the block form was
    // ignored and left 3 live security/detect-object-injection warnings.
    fields.forEach((field) => {
      // eslint-disable-next-line security/detect-object-injection
      const val = normalizedData[field];
      // eslint-disable-next-line security/detect-object-injection
      if (val && val !== existing[field]) {
        // eslint-disable-next-line security/detect-object-injection
        updates[field] = val;
      }
    });

    if (Object.keys(updates).length > 0) {
      const updatedAt = new Date().toISOString();
      await supabase
        .from('clients')
        .update({ ...updates, updated_at: updatedAt })
        .eq('id', existing.id);
      return { ...existing, ...updates, updated_at: updatedAt } as Client;
    }
    return existing;
  }

  const { data: newClient, error } = await supabase
    .from('clients')
    .insert([
      {
        name: normalizedData.name,
        surname: normalizedData.surname || null,
        email: normalizedData.email?.toLowerCase() || null,
        phone: normalizedData.phone || null,
        notes: normalizedData.notes || null,
      },
    ])
    .select()
    .single();

  if (error || !newClient) {
    throw new Error('Failed to create client: ' + error?.message);
  }
  return newClient as Client;
}

export async function getClientById(clientId: string) {
  const supabase = await createClient();
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();
  if (error || !client) {
    return null;
  }

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, services:service_id(title, duration)')
    .eq('client_id', clientId)
    .order('appointment_date', { ascending: false });

  const now = new Date();
  const upcoming = (appointments || []).filter((a) => {
    const d = new Date(a.appointment_date);
    return (a.status === 'pending' || a.status === 'confirmed') && d >= now;
  });
  const history = (appointments || []).filter((a) => a.status === 'completed');
  const cancelled = (appointments || []).filter((a) => a.status === 'cancelled');

  return {
    ...client,
    upcoming,
    history,
    cancelled,
    stats: {
      total: appointments?.length || 0,
      completed: history.length,
      cancelled: cancelled.length,
      lastAppointment: appointments?.[0]?.appointment_date || null,
    },
  };
}

export async function getAllClients(): Promise<Client[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) {
    return [];
  }
  return data as Client[];
}

export async function updateClient(
  clientId: string,
  data: Partial<ClientData>
): Promise<Result<Client>> {
  await requireAdmin();

  const supabase = await createClient();
  const updates: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() };
  if (data.email) {
    updates.email = data.email.toLowerCase();
  }
  if (data.phone) {
    updates.phone = normalizePhone(data.phone);
  }
  const { data: updated, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', clientId)
    .select()
    .single();
  if (error || !updated) {
    throw new AppError('DB', error?.message ?? 'Error al actualizar el cliente.');
  }
  return ok(updated as Client);
}

export async function deleteAppointment(appointmentId: string): Promise<Result<{ id: string }>> {
  await requireAdmin();

  const supabase = await createClient();

  const { error } = await supabase.from('appointments').delete().eq('id', appointmentId);

  if (error) {
    console.error('Failed to delete appointment:', error);
    throw new AppError('DB', 'Error al eliminar el turno.');
  }

  return ok({ id: appointmentId });
}
