import { NextRequest, NextResponse } from 'next/server';
import { sendContactFormNotification } from '@/lib/email';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Send notification to admin
    const result = await sendContactFormNotification(name, email, message);

    // Save to database (Supabase) 
    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from('contact_messages')
      .insert([{ name, email, phone: body.phone || null, message }]);

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
