'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Label } from '@/components/ui';
import { Textarea } from '@/components/ui/TextArea';
import { CheckCircle2, MessageCircle, Mail, Send } from 'lucide-react';
import { SocialIcon } from '@/components/ui/ServiceIcons';
import { motion } from 'framer-motion';
import { getAdminSettings } from '@/lib/api/settings';

// Custom TikTok icon
function TikTokIcon({ size = 18 }: { readonly size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );
}

type SocialLink = {
  label: string;
  href: string;
  handle: string;
  platform?: 'instagram' | 'whatsapp' | 'tiktok';
  icon?: React.ComponentType<{ size?: number; className?: string }>;
};

const socials: SocialLink[] = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/portadoradeeros',
    platform: 'instagram',
    handle: '@portadoradeeros',
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/5491138854297',
    icon: MessageCircle,
    handle: '+54 911 3885-4297',
  },
  {
    label: 'TikTok',
    href: 'https://tiktok.com/@portadoradeeros',
    icon: TikTokIcon,
    handle: '@portadoradeeros',
  },
  {
    label: 'Email',
    href: 'mailto:portadoradeeros@gmail.com',
    icon: Mail,
    handle: 'portadoradeeros@gmail.com',
  },
];

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [contactLinks, setContactLinks] = useState(socials);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchInfo() {
      const settings = await getAdminSettings();
      if (settings) {
        setContactLinks([
          {
            label: 'Instagram',
            href: settings.socialLinks.instagram || 'https://instagram.com/portadoradeeros',
            platform: 'instagram',
            handle: settings.socialLinks.instagram?.split('/').pop() || '@portadoradeeros',
          },
          {
            label: 'WhatsApp',
            href: settings.socialLinks.whatsapp || 'https://wa.me/5491138854297',
            icon: MessageCircle,
            handle: 'Chat directo',
          },
          {
            label: 'TikTok',
            href: settings.socialLinks.tiktok || 'https://tiktok.com/@portadoradeeros',
            icon: TikTokIcon,
            handle: '@portadoradeeros',
          },
          {
            label: 'Email',
            href: `mailto:${settings.contactEmail || 'portadoradeeros@gmail.com'}`,
            icon: Mail,
            handle: settings.contactEmail || 'portadoradeeros@gmail.com',
          },
        ]);
      }
    }
    fetchInfo();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'El mensaje es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || 'Error al enviar el mensaje' });
      }
    } catch {
      setErrors({ submit: 'Error de conexión. Intenta nuevamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] px-6">
        <div className="max-w-sm w-full text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CheckCircle2 className="w-14 h-14 mx-auto mb-5 text-black/70" />
            <h2 className="text-2xl font-light tracking-tight mb-3">
              Mensaje Enviado
            </h2>
            <p className="text-sm text-black/50 mb-6">
              Gracias por contactarme. Te responderé pronto.
            </p>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setIsSubmitted(false);
                setFormData({ name: '', email: '', phone: '', message: '' });
              }}
            >
              Enviar otro mensaje
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 md:py-24 px-6 md:px-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-black/40 font-medium block mb-4">
            Contacto
          </span>
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-black">
            Hablemos
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14 items-stretch">
          {/* Left: Form (compact) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-3 flex flex-col"
          >
            <form onSubmit={handleSubmit} className="space-y-5 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className={`text-xs ${errors.name ? 'text-red-500' : 'text-black/40'}`}>Nombre</Label>
                  <Input
                    id="name"
                    placeholder="Tu nombre"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    aria-invalid={!!errors.name}
                    className="py-3 px-4 rounded-xl"
                  />
                  {errors.name && <p className="text-[11px] text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className={`text-xs ${errors.email ? 'text-red-500' : 'text-black/40'}`}>Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    aria-invalid={!!errors.email}
                    className="py-3 px-4 rounded-xl"
                  />
                  {errors.email && <p className="text-[11px] text-red-500">{errors.email}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs text-black/40">Teléfono (opcional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+54 9 11 1234 5678"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="py-3 px-4 rounded-xl"
                />
              </div>

              <div className="space-y-1.5 flex-1 flex flex-col">
                <Label htmlFor="message" className={`text-xs ${errors.message ? 'text-red-500' : 'text-black/40'}`}>Mensaje</Label>
                <Textarea
                  id="message"
                  placeholder="Contame sobre tu consulta..."
                  rows={4}
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  aria-invalid={!!errors.message}
                  className="p-4 rounded-xl resize-none flex-1 min-h-[140px] lg:min-h-[200px]"
                />
                {errors.message && <p className="text-[11px] text-red-500">{errors.message}</p>}
              </div>

              <Button
                type="submit"
                variant="default"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-medium"
              >
                {!isLoading && <Send className="w-4 h-4" />}
                {isLoading ? 'Enviando...' : 'Enviar Mensaje'}
              </Button>
            </form>
          </motion.div>

          {/* Right: Info + Socials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            {/* Info card - Notion style */}
            <div className="rounded-2xl glass p-8 mb-8">
              <h3 className="text-lg font-medium text-[rgba(15,15,20,0.9)] mb-3">Portadora de Eros</h3>
              <p className="text-sm text-[rgba(15,15,20,0.65)] leading-relaxed">
                Guía espiritual, canalizadora y puente entre lo terrenal y lo místico.
                Conectando con la sabiduría ancestral para guiarte en tu camino.
              </p>
            </div>

            {/* Social links */}
            <div className="space-y-2">
              {contactLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 rounded-xl hover:bg-white/30 transition-colors border border-[rgba(255,255,255,0.3)]"
                >
                  <div className="w-11 h-11 rounded-lg bg-[rgba(15,15,20,0.06)] flex items-center justify-center shrink-0 group-hover:bg-[rgba(15,15,20,0.1)] transition-colors">
                    {social.platform ? (
                      <SocialIcon platform={social.platform} size={18} className="text-[rgba(15,15,20,0.6)]" />
                    ) : (
                      social.icon && <social.icon size={18} className="text-[rgba(15,15,20,0.6)]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-[rgba(15,15,20,0.45)] group-hover:text-[rgba(15,15,20,0.6)] mb-0.5">{social.label}</div>
                    <div className="text-sm font-medium text-[rgba(15,15,20,0.75)] group-hover:text-[rgba(15,15,20,0.9)] truncate transition-colors">
                      {social.handle}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
