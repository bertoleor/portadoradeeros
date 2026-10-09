'use client';

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { getAdminSettings } from '@/lib/api/settings';

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/servicios', label: 'Servicios' },
  { href: '/sobre-mi', label: 'Sobre Mí' },
  { href: '/contacto', label: 'Contacto' },
];

import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [socialLinks, setSocialLinks] = useState({ instagram: '', whatsapp: '', tiktok: '' });
  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const currentScrollY = latest;
    setIsScrolled(currentScrollY > 20);

    // Hide on scroll down, show on scroll up
    if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
      setHidden(true);
    } else {
      setHidden(false);
    }

    lastScrollY.current = currentScrollY;
  });

  useEffect(() => {
    void getAdminSettings()
      .then((settings) => {
        if (settings) {
          setSocialLinks({
            instagram: settings.socialLinks.instagram || 'https://instagram.com/portadoradeeros',
            whatsapp: settings.socialLinks.whatsapp || 'https://wa.me/5491138854297',
            tiktok: settings.socialLinks.tiktok || 'https://tiktok.com/@portadoradeeros',
          });
        }
        return undefined;
      })
      .catch(() => undefined);
  }, []);

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-20 transition-all duration-500 flex items-center justify-center',
        isScrolled
          ? 'bg-white/80 backdrop-blur-2xl border-b border-white/30 shadow-[0_1px_20px_rgba(0,0,0,0.04)]'
          : 'bg-white/8 backdrop-blur-sm border-b border-white/10',
        hidden ? '-translate-y-full' : 'translate-y-0'
      )}
    >
      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-8 flex items-center justify-between relative">
        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-3 -ml-3 text-[rgba(15,15,20,0.85)] hover:text-[rgba(15,15,20,1)] hover:bg-white/20 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo */}
        <Link
          href="/"
          className="text-sm font-semibold tracking-[0.2em] uppercase text-[rgba(15,15,20,0.85)] hover:text-[rgba(15,15,20,0.7)] transition-colors"
        >
          portadora
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm tracking-wide font-medium transition-colors ${
                isActive(link.href)
                  ? 'text-[rgba(15,15,20,0.9)] font-semibold'
                  : 'text-[rgba(15,15,20,0.65)] hover:text-[rgba(15,15,20,0.9)]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Spacer for mobile (balance the hamburger) */}
        <div className="w-12 md:hidden" />
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="md:hidden fixed inset-0 min-h-[100dvh] bg-white/92 backdrop-blur-2xl z-[90] pt-20 px-8 shadow-lg"
          >
            <div className="flex flex-col gap-6 text-center pt-8">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={link.href}
                    className={`block text-3xl font-light transition-all ${
                      isActive(link.href)
                        ? 'text-[rgba(15,15,20,0.9)] font-normal'
                        : 'text-[rgba(15,15,20,0.6)]'
                    }`}
                    onClick={handleLinkClick}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-12 pt-8 border-t border-[rgba(15,15,20,0.1)]"
              >
                <p className="text-[10px] uppercase tracking-[0.2em] text-[rgba(15,15,20,0.65)] font-medium mb-4">
                  Redes
                </p>
                <div className="flex gap-6 justify-center">
                  <a
                    href={socialLinks.instagram || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:text-[rgba(15,15,20,0.9)] text-[rgba(15,15,20,0.6)] transition-colors"
                  >
                    Instagram
                  </a>
                  <a
                    href={socialLinks.tiktok || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:text-[rgba(15,15,20,0.9)] text-[rgba(15,15,20,0.6)] transition-colors"
                  >
                    TikTok
                  </a>
                  <a
                    href={socialLinks.whatsapp || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:text-[rgba(15,15,20,0.9)] text-[rgba(15,15,20,0.6)] transition-colors"
                  >
                    WhatsApp
                  </a>
                </div>
              </motion.div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setIsMenuOpen(false)}
              aria-label="Cerrar menú"
              className="absolute top-4 right-4 md:hidden p-4 bg-white/30 text-[rgba(15,15,20,0.7)] rounded-full hover:bg-white/50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
