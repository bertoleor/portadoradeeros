import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendContactFormNotification } from '@/lib/email';
import { createClient } from '@/lib/supabase/server';

const contactSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  email: z.email('Email inválido'),
  message: z.string().min(1, 'Mensaje requerido'),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
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
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}