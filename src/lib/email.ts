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

// Send appointment confirmation email to client (Pendiente)
export async function sendAppointmentConfirmation(data: AppointmentEmailData) {
  const templateId = process.env.EMAILJS_TEMPLATE_PENDIENTE || 'template_1c7v5dg';
  
  const templateParams = {
    title: 'Solicitud Recibida',
    clientName: data.clientName,
    message: 'Tu solicitud de turno ha sido recibida correctamente. Actualmente se encuentra en revisión y será confirmada a la brevedad.',
    displayDetails: 'table',
    service: data.service,
    date: data.date,
    time: data.time,
    displayBankDetails: data.bankDetails ? 'table' : 'none',
    bankName: data.bankDetails?.bankName || '',
    bankAlias: data.bankDetails?.alias || '',
    bankCbu: data.bankDetails?.cbu || '',
    footerNote: 'Te notificaremos por email cuando tu turno sea confirmado.',
    to_email: data.clientEmail,
  };

  return sendEmailJS(templateId, templateParams);
}

// Send notification email to admin when a new appointment is requested
export async function sendNewAppointmentNotification(data: AppointmentEmailData) {
  const templateId = process.env.EMAILJS_TEMPLATE_PENDIENTE || 'template_1c7v5dg';
  
  const templateParams = {
    title: 'NUEVO TURNO PENDIENTE',
    clientName: 'Administradora',
    message: `Has recibido una nueva solicitud de turno de ${data.clientName}. Teléfono: ${data.clientPhone}`,
    displayDetails: 'table',
    service: data.service,
    date: data.date,
    time: data.time,
    displayBankDetails: 'none',
    footerNote: 'Revisa el panel de administración para confirmar o rechazar.',
    to_email: ADMIN_EMAIL,
  };

  return sendEmailJS(templateId, templateParams);
}

// Send contact form notification
export async function sendContactFormNotification(name: string, email: string, message: string) {
  const templateId = process.env.EMAILJS_TEMPLATE_PENDIENTE || 'template_1c7v5dg';
  
  const templateParams = {
    title: 'Nueva Consulta',
    clientName: 'Administradora',
    message: `Has recibido un nuevo mensaje de ${name} (${email}):\n\n${message}`,
    displayDetails: 'none',
    displayBankDetails: 'none',
    footerNote: 'Responder a la brevedad desde tu correo personal.',
    to_email: ADMIN_EMAIL,
  };

  return sendEmailJS(templateId, templateParams);
}

// Helper for direct confirmation (when admin confirms)
export async function sendAppointmentConfirmed(data: AppointmentEmailData) {
  const templateId = process.env.EMAILJS_TEMPLATE_CONFIRMADO || 'template_59jll2o';
  
  const templateParams = {
    title: 'Turno Confirmado',
    clientName: data.clientName,
    message: '¡Buenas noticias! Tu cita ha sido confirmada. Nos vemos pronto en este espacio de sanación.',
    displayDetails: 'table',
    displayCTA: 'table',
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
    title: 'Recordatorio de Turno',
    clientName: data.clientName,
    message: 'Te escribimos para recordarte que tienes una cita programada para mañana. ¡Te esperamos!',
    displayDetails: 'table',
    displayCTA: 'table',
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
    title: 'Turno Cancelado',
    clientName: data.clientName,
    message: `Lamentamos informarte que tu cita ha sido cancelada.${reason ? ' Motivo: ' + reason : ''} Si tienes dudas, contáctanos por WhatsApp.`,
    displayDetails: 'table',
    displayCTA: 'none',
    service: data.service,
    date: data.date,
    time: data.time,
    to_email: data.clientEmail,
  };

  return sendEmailJS(templateId, templateParams);
}
