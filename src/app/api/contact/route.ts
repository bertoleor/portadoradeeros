import { NextResponse } from 'next/server';
import { z } from 'zod';

import { sendContactFormNotification } from '@/lib/email';
import { logger } from '@/lib/logger';
import {
  checkRateLimit,
  HONEYPOT_FIELD,
  isHoneypotTriggered,
  resolveClientIp,
  SPAM_RATE_LIMIT,
} from '@/lib/spam-protection';
import { createClient } from '@/lib/supabase/server';

import type { NextRequest } from 'next/server';

export const contactSchema = z.object({
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

    // Save to database (Supabase). A failed insert must NOT be swallowed:
    // the admin email still went out, but the lead's audit copy is missing
    // — surface it via dbSaved so the caller (and /admin/mensajes) can
    // tell a persisted lead from a silently lost one (EROS-B3).
    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from('contact_messages')
      .insert([{ name, email, phone: phone || null, message }]);

    const dbSaved = !dbError;
    if (dbError) {
      logger.error('Supabase contact save error', {
        table: 'contact_messages',
        code: dbError.code,
        message: dbError.message,
      });
    }
    return NextResponse.json({
      success: true,
      message: 'Mensaje enviado exitosamente',
      emailSent: result.success,
      dbSaved,
    });
  } catch (error) {
    logger.error('Error processing contact form', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}
