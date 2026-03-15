 import { Service, BusinessSettings } from '@/types';

// Admin authentication is handled via Supabase Auth

// Services data
export const SERVICES: Service[] = [
  {
    id: '1',
    title: 'Sesion de Tarot',
    description: 'Las cartas del tarot son una herramienta ancestral que permite explorar el pasado, presente y futuro. En tu sesion, sumergiremos en los arquetipos y simbolos para guiarte en tus decisiones y revelar lo que el universo tiene preparado para ti.',
    shortDescription: 'Explora tu pasado, presente y futuro a traves de las cartas',
    icon: 'tarot',
    price: 5000,
    duration: 60,
    isVisible: true,
    slug: 'tarot',
    images: [],
  },
  {
    id: '2',
    title: 'Sesion de Buzios',
    description: 'Los buzios son conchas sagradas utilizadas en la religion de origen africano para comunicarse con los orishas y recibir mensajes divinos. Esta sesion te conectara con la sabiduria ancestral para resolver tus preguntas y conflictos.',
    shortDescription: 'Conexion con los orishas para recibir mensajes divinos',
    icon: 'buzios',
    price: 6000,
    duration: 90,
    isVisible: true,
    slug: 'buzios',
    images: [],
  },
  {
    id: '3',
    title: 'Limpieza Energetica',
    description: 'Las energias negativas pueden acumularse en nuestro alrededor y afectar nuestra vida cotidiana. A traves de rituales sagrados y tecnicas ancestrales, liberaremos tu espacio de esas energias para que puedas fluir con mayor claridad y bienestar.',
    shortDescription: 'Libera tu espacio de energias negativas',
    icon: 'energy',
    price: 8000,
    duration: 120,
    isVisible: true,
    slug: 'limpieza-energetica',
    images: [],
  },
  {
    id: '4',
    title: 'Velomancia',
    description: 'La velomancia es el arte de leer la luz de las velas para revelar mensajes del mas alla. Esta practica ancestral te permitira recibir respuestas de tus seres queridos que ya no estan fisicamente, y encontrar paz en momentos de duda.',
    shortDescription: 'Lee la luz de las velas para recibir mensajes del mas alla',
    icon: 'candle',
    price: 7000,
    duration: 75,
    isVisible: true,
    slug: 'velomancia',
    images: [],
  },
];

// Default business settings
export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  siteUrl: '',
  contactEmail: '',
  bioContent: '',
  profileImageUrl: '',
  socialLinks: {
    instagram: '',
    facebook: '',
    twitter: '',
    whatsapp: '',
    tiktok: '',
    youtube: '',
  },
  businessHours: {
    monday: { start: '09:00', end: '18:00', closed: false },
    tuesday: { start: '09:00', end: '18:00', closed: false },
    wednesday: { start: '09:00', end: '18:00', closed: false },
    thursday: { start: '09:00', end: '18:00', closed: false },
    friday: { start: '09:00', end: '18:00', closed: false },
    saturday: { start: '10:00', end: '14:00', closed: false },
    sunday: { start: '', end: '', closed: true },
  },
  bankDetails: {
    bankOwner: 'Jacqueline',
    bankName: 'Mercado Pago',
    cbu: '',
    alias: '',
  },
  appointmentDuration: 60,
  adminName: 'Jacque',
  adminAvatarUrl: '',
};

// Available time slots
export const TIME_SLOTS = [
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