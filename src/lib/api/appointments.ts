'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminSettings } from '@/lib/api/settings';
import webPush from 'web-push';
import { 
  sendAppointmentConfirmation, 
  sendNewAppointmentNotification,
  sendAppointmentConfirmed,
  sendAppointmentCancellation
} from '@/lib/email';

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
    const supabase = await createClient();
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error || !subs) return;

    const pushPromises = subs.map((sub: { id: string; endpoint: string; p256dh: string; auth: string }) => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      return webPush.sendNotification(
        pushConfig,
        JSON.stringify(payload)
      ).catch(err => {
        // If 410 Gone or 404, the subscription is expired/invalid
        if (err.statusCode === 410 || err.statusCode === 404) {
          return supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
        console.error('Push error for sub:', sub.id, err);
      });
    });

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
}

export async function createAppointment(payload: AppointmentPayload) {
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
    return { success: false, error: 'Hubo un error al registrar el turno en la base de datos.' };
  }

  // 2. Fetch settings
  const settings = await getAdminSettings();
  const bankDetails = settings?.bankDetails || {
    bankOwner: 'Jacqueline',
    bankName: 'Mercado Pago',
    cbu: 'No configurado',
    alias: 'PORTADORA.EROS'
  };

  // 3. Notify
  await sendBookingEmails(payload, bankDetails);

  // 3. Push
  void sendPushToAdmins({
    title: 'Nuevo turno ✨',
    body: `${payload.clientName} agendó ${payload.serviceName}.`,
    url: '/admin'
  });

  return { success: true, data: dbData };
}

async function sendBookingEmails(payload: AppointmentPayload, bankDetails: {
  bankOwner: string;
  bankName: string;
  cbu: string;
  alias: string;
}) {
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
    }
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
    .select(`
      *,
      services ( title )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch appointments:', error);
    return [];
  }

  return data;
}

export async function getBookedSlots(dateStr: string, durationMinutes: number = 60) {
  const supabase = await createClient();

  // Fetch appointments for the given date with service duration
  const { data, error } = await supabase
    .from('appointments')
    .select('appointment_date, services:service_id(duration)')
    .filter('appointment_date', 'gte', `${dateStr}T00:00:00Z`)
    .filter('appointment_date', 'lte', `${dateStr}T23:59:59Z`)
    .neq('status', 'cancelled');

  if (error) {
    console.error('Failed to fetch booked slots:', error);
    return [];
  }

  // Generate all time slots that would be occupied based on duration
  const occupiedSlots: string[] = [];
  
  for (const app of data) {
    const startDate = new Date(app.appointment_date);
    const duration = (app.services as { duration?: number })?.duration || durationMinutes;
    
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

export async function confirmAppointment(appointmentId: string) {
  const supabase = await createClient();

  // 1. Fetch current appointment
  const { data: appointment, error: fetchError } = await supabase
    .from('appointments')
    .select('*, services:service_id(title)')
    .eq('id', appointmentId)
    .single();

  if (fetchError || !appointment) {
    console.error('Failed to fetch appointment:', fetchError);
    return { success: false, error: 'No se pudo obtener el turno.' };
  }

  // 2. Update status to confirmed
  const { error: updateError } = await supabase
    .from('appointments')
    .update({ status: 'confirmed' })
    .eq('id', appointmentId);

  if (updateError) {
    console.error('Failed to update appointment status:', updateError);
    return { success: false, error: 'Ocurrió un error al actualizar el estado.' };
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
      price: 0
    });
  } catch (emailError) {
    console.error('Failed to send Confirmed email:', emailError);
  }

  return { success: true };
}

// Complete an appointment (mark as completed after session)
export async function completeAppointment(appointmentId: string) {
  const supabase = await createClient();

  // 1. Fetch current appointment
  const { data: appointment, error: fetchError } = await supabase
    .from('appointments')
    .select('*, services:service_id(title)')
    .eq('id', appointmentId)
    .single();

  if (fetchError || !appointment) {
    console.error('Failed to fetch appointment:', fetchError);
    return { success: false, error: 'No se pudo obtener el turno.' };
  }

  // 2. Update status to completed
  const { error: updateError } = await supabase
    .from('appointments')
    .update({ status: 'completed' })
    .eq('id', appointmentId);

  if (updateError) {
    console.error('Failed to update appointment status:', updateError);
    return { success: false, error: 'Ocurrió un error al actualizar el estado.' };
  }

  return { success: true };
}

// Cancel an appointment
export async function cancelAppointment(appointmentId: string, reason?: string) {
  const supabase = await createClient();

  // 1. Fetch current appointment
  const { data: appointment, error: fetchError } = await supabase
    .from('appointments')
    .select('*, services:service_id(title)')
    .eq('id', appointmentId)
    .single();

  if (fetchError || !appointment) {
    console.error('Failed to fetch appointment:', fetchError);
    return { success: false, error: 'No se pudo obtener el turno.' };
  }

  // 2. Update status to cancelled
  const { error: updateError } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId);

  if (updateError) {
    console.error('Failed to update appointment status:', updateError);
    return { success: false, error: 'Ocurrió un error al cancelar el turno.' };
  }

  // 3. Send Cancellation Email to Client
  const formattedDate = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires', 
  }).format(new Date(appointment.appointment_date));

  const serviceName = appointment.services?.title || 'tu sesión';

  try {
    await sendAppointmentCancellation({
      clientName: appointment.client_name,
      clientEmail: appointment.client_email,
      clientPhone: appointment.client_phone || '',
      service: serviceName,
      date: formattedDate.split(' a las ')[0],
      time: formattedDate.split(' a las ')[1] || '',
      price: 0
    }, reason);
  } catch (emailError) {
    console.error('Failed to send Cancellation email:', emailError);
  }

  return { success: true };
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

export async function updateContactStatus(id: string, status: 'read' | 'archived') {
  const supabase = await createClient();
  const { error } = await supabase
    .from('contact_messages')
    .update({ status })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// SMART COLLISION DETECTION
// Checks whether a proposed [startTime, startTime + durationMin] window
// overlaps any existing appointment on the same day.
// ─────────────────────────────────────────────────────────────────────────────
export async function checkSlotAvailability(
  proposedStart: Date,
  durationMin: number,
  excludeId?: string,
): Promise<{ available: boolean; conflictWith?: string }> {
  const supabase = await createClient();

  const dayStart = new Date(proposedStart);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(proposedStart);
  dayEnd.setHours(23, 59, 59, 999);

  let query = supabase
    .from('appointments')
    .select('id, appointment_date, client_name, services:service_id(duration)')
    .gte('appointment_date', dayStart.toISOString())
    .lte('appointment_date', dayEnd.toISOString())
    .neq('status', 'cancelled');

  if (excludeId) query = query.neq('id', excludeId);

  const { data, error } = await query;
  if (error) return { available: true }; // fail open so booking is never blocked by a query error

  const proposedEnd = new Date(proposedStart.getTime() + durationMin * 60_000);

  for (const app of data ?? []) {
    const existStart = new Date(app.appointment_date);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existDuration: number = (app.services as any)?.duration ?? 60;
    const existEnd = new Date(existStart.getTime() + existDuration * 60_000);

    // Overlap condition: proposed start < existing end AND proposed end > existing start
    if (proposedStart < existEnd && proposedEnd > existStart) {
      return { available: false, conflictWith: app.client_name };
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

export async function createAppointmentAdmin(payload: AdminAppointmentPayload) {
  // 1. Check for collisions first
  const availability = await checkSlotAvailability(payload.appointmentDate, payload.serviceDuration);
  if (!availability.available) {
    return {
      success: false,
      error: `Ese horario se superpone con el turno de ${availability.conflictWith ?? 'otro cliente'}. Por favor elegí otro horario.`,
    };
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
    .insert([{
      service_id: payload.serviceId || null,
      client_id: clientId || null, // Link to clients table
      client_name: payload.clientName, // Keep for backwards compatibility
      client_email: payload.clientEmail,
      client_phone: payload.clientPhone || null,
      appointment_date: payload.appointmentDate.toISOString(),
      notes: payload.notes || null,
      status: 'confirmed',
    }])
    .select()
    .single();

  if (dbError) return { success: false, error: 'Error al registrar el turno.' };

  // 3. Send confirmation email to client
  const formattedDate = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'full', timeStyle: 'short',
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
      price: 0
    });
  } catch (emailErr) {
    console.error('Email error on admin appointment:', emailErr);
  }

  // 4. Push Notification to all admin devices
  void sendPushToAdmins({
    title: 'Nuevo turno (Manual) ✨',
    body: `Turno creado para ${payload.clientName}: ${payload.serviceName}.`,
    url: '/admin'
  });

  return { success: true, data: dbData };
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
    .select('id, client_name, client_email, client_phone, appointment_date, status, services:service_id(title)')
    .order('appointment_date', { ascending: false });

  if (error || !data) return [];

  // Group by email
  const map = new Map<string, ClientRecord>();
  for (const row of data) {
    const serviceTitle = (row.services as unknown as { title: string | null }[])?.[0]?.title ?? null;
    const existing = map.get(row.client_email);
    const appt = {
      id: row.id,
      appointment_date: row.appointment_date,
      status: row.status,
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
  const clients = Array.from(map.values()).map(c => ({
    ...c,
    totalAppointments: c.appointments.length,
    lastAppointment: c.appointments[0]?.appointment_date ?? '',
  }));

  return clients.sort((a, b) => new Date(b.lastAppointment).getTime() - new Date(a.lastAppointment).getTime());
}

// ─────────────────────────────────────────────────────────────────────────────
// GET BLOCKED TIMES FOR A SPECIFIC DATE (Client Side)
// Returns times that admin has blocked for a given date
// ─────────────────────────────────────────────────────────────────────────────
export async function getBlockedTimesForDate(dateStr: string): Promise<{ start: string; end: string; isAllDay: boolean }[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('blocked_times')
    .select('*')
    .eq('date', dateStr);

  if (error || !data) return [];

  return data.map((bt: { time_start: string | null; time_end: string | null; is_all_day: boolean }) => ({
    start: bt.time_start || '00:00',
    end: bt.time_end || '23:59',
    isAllDay: bt.is_all_day
  }));
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
 * Helper to get occupied windows for a specific date:
 * - Appointments
 * - Blocked times
 */
async function getOccupiedWindowsForDate(dateStr: string, checkDateTime: number, defaultDurationMs: number) {
  const supabase = await createClient();
  const windows: { start: number; end: number }[] = [];
  
  // 1. Get blocked times
  const blockedTimes = await getBlockedTimesForDate(dateStr);
  for (const bt of blockedTimes) {
    if (bt.isAllDay) {
      windows.push({ start: checkDateTime, end: checkDateTime + 24 * 60 * 60 * 1000 });
    } else {
      const [sh, sm] = bt.start.split(':').map(Number);
      const [eh, em] = bt.end.split(':').map(Number);
      windows.push({
        start: checkDateTime + sh * 3600000 + sm * 60000,
        end: checkDateTime + eh * 3600000 + em * 60000
      });
    }
  }
  
  // 2. Get appointments
  const { data: apts } = await supabase.from('appointments').select('appointment_date, services:service_id(duration)')
    .gte('appointment_date', `${dateStr}T00:00:00Z`).lte('appointment_date', `${dateStr}T23:59:59Z`).neq('status', 'cancelled');
  
  if (apts) {
    for (const apt of apts) {
      const start = new Date(apt.appointment_date).getTime();
      const dur = (apt.services as { duration?: number })?.duration || (defaultDurationMs / 60000);
      windows.push({ start, end: start + dur * 60000 });
    }
  }
  
  return windows;
}

export async function getNextAvailableSlots(
  businessHours: Record<string, { closed: boolean; start: string; end: string }>,
  durationMinutes: number,
  count: number = 5
): Promise<AvailableSlot[]> {
  const availableSlots: AvailableSlot[] = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const slotDurationMs = durationMinutes * 60000;
  
  for (let d = 0; d < 30 && availableSlots.length < count; d++) {
    const checkDate = new Date(today); checkDate.setDate(checkDate.getDate() + d);
    const dateStr = checkDate.toISOString().split('T')[0];
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][checkDate.getDay()];
    const bh = businessHours[dayName];
    
    if (!bh || bh.closed) continue;
    
    const occupied = await getOccupiedWindowsForDate(dateStr, checkDate.getTime(), slotDurationMs);
    const [sH, sM] = bh.start.split(':').map(Number);
    const [eH, eM] = bh.end.split(':').map(Number);
    const dayStartMs = checkDate.getTime() + sH * 3600000 + sM * 60000;
    const dayEndMs = checkDate.getTime() + eH * 3600000 + eM * 60000;
    
    for (let cur = dayStartMs; cur + slotDurationMs <= dayEndMs && availableSlots.length < count; cur += 1800000) {
      if (!occupied.some(w => cur < w.end && (cur + slotDurationMs) > w.start)) {
        const sd = new Date(cur);
        availableSlots.push({
          date: dateStr,
          time: `${sd.getUTCHours().toString().padStart(2, '0')}:${sd.getUTCMinutes().toString().padStart(2, '0')}`,
          datetime: sd.toISOString()
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
  created_at: string;
  updated_at: string;
}

interface ClientData {
  name: string;
  surname?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  return phone.replaceAll(/\D/g, '');
}

export async function findClient(phone?: string, email?: string): Promise<Client | null> {
  const supabase = await createClient();
  
  if (phone) {
    const normalizedPhone = normalizePhone(phone);
    const { data: phoneClients } = await supabase.from('clients').select('*').not('phone', 'is', null);
    if (phoneClients) {
      const found = phoneClients.find(c => normalizePhone(c.phone) === normalizedPhone);
      if (found) return found as Client;
    }
  }
  
  if (email) {
    const { data: emailClients } = await supabase.from('clients').select('*').eq('email', email.toLowerCase()).single();
    if (emailClients) return emailClients as Client;
  }
  
  return null;
}

export async function findOrCreateClient(data: ClientData): Promise<Client> {
  const supabase = await createClient();
  const existing = await findClient(data.phone, data.email);
  
  if (existing) {
    const updates: Partial<ClientData> = {};
    const fields: (keyof ClientData)[] = ['name', 'surname', 'email', 'phone'];
    
    fields.forEach(field => {
      const val = data[field];
      if (val && val !== existing[field]) {
        updates[field] = val;
      }
    });
    
    if (Object.keys(updates).length > 0) {
      const updatedAt = new Date().toISOString();
      await supabase.from('clients').update({ ...updates, updated_at: updatedAt }).eq('id', existing.id);
      return { ...existing, ...updates, updated_at: updatedAt } as Client;
    }
    return existing;
  }
  
  const { data: newClient, error } = await supabase.from('clients').insert([{
    name: data.name,
    surname: data.surname || null,
    email: data.email?.toLowerCase() || null,
    phone: data.phone || null,
    notes: data.notes || null,
  }]).select().single();
  
  if (error || !newClient) throw new Error('Failed to create client: ' + error?.message);
  return newClient as Client;
}

export async function getClientById(clientId: string) {
  const supabase = await createClient();
  const { data: client, error } = await supabase.from('clients').select('*').eq('id', clientId).single();
  if (error || !client) return null;
  
  const { data: appointments } = await supabase.from('appointments').select('*, services:service_id(title, duration)').eq('client_id', clientId).order('appointment_date', { ascending: false });
  
  const now = new Date();
  const upcoming = (appointments || []).filter(a => { const d = new Date(a.appointment_date); return (a.status === 'pending' || a.status === 'confirmed') && d >= now; });
  const history = (appointments || []).filter(a => a.status === 'completed');
  const cancelled = (appointments || []).filter(a => a.status === 'cancelled');
  
  return { ...client, upcoming, history, cancelled, stats: { total: appointments?.length || 0, completed: history.length, cancelled: cancelled.length, lastAppointment: appointments?.[0]?.appointment_date || null } };
}

export async function getAllClients(): Promise<Client[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as Client[];
}

export async function updateClient(clientId: string, data: Partial<ClientData>) {
  const supabase = await createClient();
  const updates: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() };
  if (data.email) updates.email = data.email.toLowerCase();
  const { data: updated, error } = await supabase.from('clients').update(updates).eq('id', clientId).select().single();
  if (error || !updated) return { success: false, error: error?.message };
  return { success: true, data: updated as Client };
}

export async function deleteAppointment(appointmentId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId);

  if (error) {
    console.error('Failed to delete appointment:', error);
    return { success: false, error: 'Error al eliminar el turno.' };
  }

  return { success: true };
}

