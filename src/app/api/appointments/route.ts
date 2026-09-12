import { NextResponse } from 'next/server';
import { z } from 'zod';

import { sendAppointmentConfirmation, sendNewAppointmentNotification } from '@/lib/email';
import {
  checkRateLimit,
  HONEYPOT_FIELD,
  isHoneypotTriggered,
  resolveClientIp,
  SPAM_RATE_LIMIT,
} from '@/lib/spam-protection';

import type { NextRequest } from 'next/server';

const appointmentSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  surname: z.string().min(1, 'Apellido requerido'),
  email: z.email('Email inválido'),
  phone: z.string().min(1, 'Teléfono requerido'),
  service: z.string().min(1, 'Servicio requerido'),
  date: z.string().min(1, 'Fecha requerida'),
  time: z.string().min(1, 'Hora requerida'),
  price: z.coerce.number(),
  bankDetails: z
    .object({
      bankName: z.string().default(''),
      accountType: z.string().default(''),
      accountNumber: z.string().default(''),
      cbu: z.string().default(''),
      alias: z.string().default(''),
    })
    .optional(),
  [HONEYPOT_FIELD]: z.string().optional(),
});

const RATE_LIMIT_SCOPE = 'appointments';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // HONEYPOT — bots that fill the hidden field get a silent no-op success so
    // they cannot distinguish being caught; no email is sent.
    if (isHoneypotTriggered(body[HONEYPOT_FIELD])) {
      return NextResponse.json({
        success: true,
        message: 'Cita agendada exitosamente',
      });
    }

    // RATE LIMIT — cap email sends per IP.
    const ip = resolveClientIp(request);
    const rate = checkRateLimit(RATE_LIMIT_SCOPE, ip, SPAM_RATE_LIMIT);
    if (rate.limited) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.' },
        { status: 429 }
      );
    }

    const parsed = appointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const { name, surname, email, phone, service, date, time, price, bankDetails } = parsed.data;

    // Format the date for display
    const formattedDate = new Date(date).toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Send confirmation email to client
    const clientEmailResult = await sendAppointmentConfirmation({
      clientName: `${name} ${surname}`,
      clientEmail: email,
      clientPhone: phone,
      service,
      date: formattedDate,
      time,
      price,
      bankDetails,
    });

    // Send notification to admin
    const adminNotificationResult = await sendNewAppointmentNotification({
      clientName: `${name} ${surname}`,
      clientEmail: email,
      clientPhone: phone,
      service,
      date: formattedDate,
      time,
      price,
    });

    // Future integration: Save to database (Supabase) when configured
    // For now, we just send emails

    return NextResponse.json({
      success: true,
      message: 'Cita agendada exitosamente',
      clientEmailSent: clientEmailResult.success,
      adminNotificationSent: adminNotificationResult.success,
    });
  } catch (error) {
    console.error('Error processing appointment:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}

export async function GET() {
  // Return available time slots
  // Future integration: Fetch from database when configured
  const timeSlots = [
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
  ];

  return NextResponse.json({ timeSlots });
}
