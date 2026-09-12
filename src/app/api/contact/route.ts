import { NextResponse } from 'next/server';
import { z } from 'zod';

import { sendContactFormNotification } from '@/lib/email';
import {
  checkRateLimit,
  HONEYPOT_FIELD,
  isHoneypotTriggered,
  resolveClientIp,
  SPAM_RATE_LIMIT,
} from '@/lib/spam-protection';
import { createClient } from '@/lib/supabase/server';

import type { NextRequest } from 'next/server';

const contactSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  email: z.email('Email inválido'),
  message: z.string().min(1, 'Mensaje requerido'),
  phone: z.string().optional(),
  [HONEYPOT_FIELD]: z.string().optional(),
});

const RATE_LIMIT_SCOPE = 'contact';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // HONEYPOT — reject bots that filled the hidden field (silently, so they
    // learn nothing) before any validation side-effect.
    if (isHoneypotTriggered(body[HONEYPOT_FIELD])) {
      return NextResponse.json({
        success: true,
        message: 'Mensaje enviado exitosamente',
      });
    }

    // RATE LIMIT — cap email/DB writes per IP so a public form cannot be used
    // as an open spam relay.
    const ip = resolveClientIp(request);
    const rate = checkRateLimit(RATE_LIMIT_SCOPE, ip, SPAM_RATE_LIMIT);
    if (rate.limited) {
      return NextResponse.json(
        { error: 'Demasiados envíos. Intenta nuevamente en unos minutos.' },
        { status: 429 }
      );
    }

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const { name, email, message, phone } = parsed.data;

    // Send notification to admin
    const result = await sendContactFormNotification(name, email, message);

    // Save to database (Supabase)
    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from('contact_messages')
      .insert([{ name, email, phone: phone || null, message }]);

    if (dbError) {
      console.error('Supabase contact save error:', dbError);
    }
    return NextResponse.json({
      success: true,
      message: 'Mensaje enviado exitosamente',
      emailSent: result.success,
    });
  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}
