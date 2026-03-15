'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getAdminSettings } from '@/lib/api/settings';

import { SocialIcon } from '@/components/ui/ServiceIcons';

// TikTokIcon is no longer needed here as it's in SocialIcon

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/servicios', label: 'Servicios' },
  { href: '/sobre-mi', label: 'Sobre Mí' },
  { href: '/contacto', label: 'Contacto' },
];

const initialSocials = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/portadoradeeros',
    platform: 'instagram' as const,
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/5491138854297',
    platform: 'whatsapp' as const,
  },
  {
    label: 'TikTok',
    href: 'https://tiktok.com/@portadoradeeros',
    platform: 'tiktok' as const,
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [footerSocials, setFooterSocials] = useState(initialSocials);

  useEffect(() => {
    async function fetchSocials() {
      const settings = await getAdminSettings();
      if (settings) {
        setFooterSocials([
          {
            label: 'Instagram',
            href: settings.socialLinks.instagram || 'https://instagram.com/portadoradeeros',
            platform: 'instagram' as const,
          },
          {
            label: 'WhatsApp',
            href: settings.socialLinks.whatsapp || 'https://wa.me/5491138854297',
            platform: 'whatsapp' as const,
          },
          {
            label: 'TikTok',
            href: settings.socialLinks.tiktok || 'https://tiktok.com/@portadoradeeros',
            platform: 'tiktok' as const,
          },
        ]);
      }
    }
    fetchSocials();
  }, []);

  return (
    <footer className="w-full py-12 md:py-16 border-t border-gray-100 mt-auto bg-white/50 backdrop-blur-sm">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 items-start mb-12">
          {/* Logo & Brand */}
          <div className="space-y-4">
            <Link
              href="/"
              className="text-sm font-semibold tracking-[0.3em] uppercase text-black hover:text-black/60 transition-colors"
            >
              portadora de eros
            </Link>
            <p className="text-[11px] text-black/40 font-light leading-relaxed max-w-[200px] uppercase tracking-wider">
              Sabiduría ancestral para el camino del alma.
            </p>
          </div>

          {/* Navigation */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-black uppercase tracking-[0.2em]">Sitio</h4>
              <nav className="flex flex-col gap-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-xs font-light text-black/50 hover:text-black transition-colors tracking-wide w-fit"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-black uppercase tracking-[0.2em]">Legal</h4>
              <nav className="flex flex-col gap-3">
                <Link href="/terminos" className="text-xs font-light text-black/50 hover:text-black transition-colors tracking-wide w-fit">Términos</Link>
                <Link href="/politica-cancelacion" className="text-xs font-light text-black/50 hover:text-black transition-colors tracking-wide w-fit">Cancelación</Link>
                <Link href="/privacidad" className="text-xs font-light text-black/50 hover:text-black transition-colors tracking-wide w-fit">Privacidad</Link>
              </nav>
            </div>
          </div>

          {/* Socials */}
          <div className="flex flex-col md:items-end gap-6">
            <h4 className="text-[10px] font-bold text-black uppercase tracking-[0.2em]">Seguime</h4>
            <div className="flex items-center gap-3">
              {footerSocials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full text-black/40 hover:text-black hover:bg-black/5 border border-black/5 transition-all duration-300"
                  aria-label={social.label}
                >
                  <SocialIcon platform={social.platform} size={18} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-[10px] text-black/30 font-light tracking-wide leading-relaxed">
            © {currentYear} PORTADORA DE EROS. TODOS LOS DERECHOS RESERVADOS. <br className="md:hidden" />
            QUEDA PROHIBIDA LA REPRODUCCIÓN TOTAL O PARCIAL DE ESTE SITIO.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-black/10"></span>
            <p className="text-[10px] text-black/20 font-medium tracking-[0.2em] uppercase">Buenos Aires, Argentina</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
