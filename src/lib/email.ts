import emailjs from '@emailjs/nodejs';

// Initialize EmailJS
const SERVICE_ID = process.env.EMAILJS_SERVICE_ID || '';
const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || '';
const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || '';

const ADMIN_EMAIL = 'portadoradeeros@gmail.com';

export interface AppointmentEmailData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  service: string;
  date: string;
  time: string;
  price: number;
  bankDetails?: {
    bankName: string;
    accountType: string;
    accountNumber: string;
    cbu: string;
    alias: string;
  };
}

/**
 * Generic function to send email via EmailJS
 */
async function sendEmailJS(templateId: string, templateParams: Record<string, unknown>) {
  if (!SERVICE_ID || !PUBLIC_KEY || !PRIVATE_KEY) {
    console.error('EmailJS credentials missing');
    return { success: false, error: 'EmailJS not configured' };
  }

  try {
    const response = await emailjs.send(
      SERVICE_ID,
      templateId,
      templateParams,
      {
        publicKey: PUBLIC_KEY,
        privateKey: PRIVATE_KEY,
      }
    );
    return { success: true, response };
  } catch (error) {
    console.error('Error sending EmailJS:', error);
    return { success: false, error };
  }
}

// Send "request received" confirmation email to client when they book a turno.
// Uses the dedicated "pendiente" template so the client knows their request is
// awaiting admin confirmation (distinct from the "confirmed" email sent later).
export async function sendAppointmentConfirmation(data: AppointmentEmailData) {
  const templateId = process.env.EMAILJS_TEMPLATE_PENDIENTE || 'template_59jll2o';

  const templateParams = {
    clientName: data.clientName,
    service: data.service,
    date: data.date,
    time: data.time,
    to_email: data.clientEmail,
  };

  return sendEmailJS(templateId, templateParams);
}

// Send notification email to admin when a new appointment is requested
export async function sendNewAppointmentNotification(data: AppointmentEmailData) {
  // Envía a admin - usa el template fijo (solo muestra service, date, time)
  const templateId = process.env.EMAILJS_TEMPLATE_CONFIRMADO || 'template_59jll2o';
  
  const templateParams = {
    clientName: 'Administradora', // Este campo es {{clientName}} en el template
    service: `${data.service} - ${data.clientName} (${data.clientPhone})`, // Incluye info del cliente
    date: data.date,
    time: data.time,
    to_email: ADMIN_EMAIL,
  };

  return sendEmailJS(templateId, templateParams);
}

// Send contact form notification to admin
export async function sendContactFormNotification(name: string, email: string, message: string) {
  const templateId = process.env.EMAILJS_TEMPLATE_CONFIRMADO || 'template_59jll2o';

  const templateParams = {
    clientName: name,
    service: message,
    date: '',
    time: '',
    to_email: ADMIN_EMAIL,
    from_email: email,
  };

  return sendEmailJS(templateId, templateParams);
}

// Helper for direct confirmation (when admin confirms)
export async function sendAppointmentConfirmed(data: AppointmentEmailData) {
  const templateId = process.env.EMAILJS_TEMPLATE_CONFIRMADO || 'template_59jll2o';
  
  const templateParams = {
    clientName: data.clientName,
    service: data.service,
    date: data.date,
    time: data.time,
    to_email: data.clientEmail,
  };

  return sendEmailJS(templateId, templateParams);
}

// Send appointment reminder
export async function sendAppointmentReminder(data: AppointmentEmailData) {
  const templateId = process.env.EMAILJS_TEMPLATE_CONFIRMADO || 'template_59jll2o';
  
  const templateParams = {
    clientName: data.clientName,
    service: data.service,
    date: data.date,
    time: data.time,
    to_email: data.clientEmail,
  };

  return sendEmailJS(templateId, templateParams);
}

// Send appointment cancellation
export async function sendAppointmentCancellation(data: AppointmentEmailData, reason?: string) {
  const templateId = process.env.EMAILJS_TEMPLATE_CONFIRMADO || 'template_59jll2o';
  
  const templateParams = {
    clientName: data.clientName,
    service: data.service,
    date: data.date,
    time: data.time,
    to_email: data.clientEmail,
    reason: reason ?? '',
  };

  return sendEmailJS(templateId, templateParams);
}
