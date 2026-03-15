// Service types
export interface Service {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  icon: string;
  price: number;
  duration: number; // in minutes
  isVisible: boolean;
  slug: string;
  images: string[]; // Array of image URLs for the service gallery
}

// Client types
export interface Client {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  createdAt: Date;
  appointments: Appointment[];
}

// Appointment types
export interface Appointment {
  id: string;
  clientId: string;
  serviceId: string;
  date: Date;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

// Admin user type
export interface AdminUser {
  username: string;
  isAuthenticated: boolean;
}

// Social links type
export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  whatsapp?: string;
  tiktok?: string;
  youtube?: string;
}

// Business settings type
export interface BusinessSettings {
  contactEmail: string;
  siteUrl: string;
  bioContent: string;
  profileImageUrl: string;
  socialLinks: SocialLinks;
  businessHours: {
    [key: string]: { start: string; end: string; closed: boolean };
  };
  bankDetails: {
    bankOwner: string;
    bankName: string;
    cbu: string;
    alias: string;
  };
  appointmentDuration: number;
  adminName: string;
  adminAvatarUrl: string;
}

// Form types for scheduling
export interface SchedulingFormData {
  name: string;
  surname: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  serviceId: string;
}

// Error boundary types
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// PWA types
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
