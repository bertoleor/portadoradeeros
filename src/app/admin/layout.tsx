'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Calendar, Settings, Sparkles, LogOut, Menu, X, MessageSquare, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { createClient } from '@/lib/supabase/client';

const adminLinks = [
  { href: '/admin', label: 'Inicio', icon: LayoutDashboard },
  { href: '/admin/servicios', label: 'Servicios', icon: Sparkles },
  { href: '/admin/calendario', label: 'Calendario', icon: Calendar },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/mensajes', label: 'Mensajes', icon: MessageSquare },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
];


export default function AdminLayout({ children }: { readonly children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [newAppointmentCount, setNewAppointmentCount] = useState(0);

  // ── Supabase Realtime ────────────────────────────────────────────────
  const setupRealtime = useCallback(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('admin-appointments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'appointments' },
        (payload) => {
          const clientName = (payload.new as { client_name?: string }).client_name ?? 'Un cliente';
          setNewAppointmentCount(n => n + 1);
          // Show browser notification if SW + permission granted
          if (globalThis.window !== undefined && 'Notification' in globalThis && Notification.permission === 'granted') {
            void navigator.serviceWorker.ready.then(sw => {
              void sw.showNotification('Nuevo turno agendado ✨', {
                body: `${clientName} agendó una consulta.`,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png',
                tag: 'new-appointment',
              });
            });
          }
        }
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  // ── Auth Logic ───────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    let cleanup: (() => void) | void;

    const checkAuth = async () => {
      if (isAuthenticated === true && pathname !== '/admin/login') return;

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!active) return;

      if (session) {
        setIsAuthenticated(true);
        cleanup = setupRealtime();
      } else {
        if (pathname !== '/admin/login') {
          router.push('/admin/login');
        }
        setIsAuthenticated(false);
      }
    };

    void checkAuth();
    return () => { 
      active = false; 
      if (cleanup) cleanup();
    };
  }, [pathname, router, setupRealtime, isAuthenticated]);

  if (pathname === '/admin/login' || pathname === '/admin/bienvenida') {
    return <>{children}</>;
  }

  if (isAuthenticated === null) {
    return <div className="min-h-screen bg-white flex items-center justify-center p-4 text-black"><div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin"/></div>;
  }

  return (
    <div className="flex min-h-screen text-white">
      <aside className="hidden lg:flex w-56 flex-col fixed inset-y-0 z-50 bg-[rgba(15,15,20,0.75)] backdrop-blur-2xl border-r border-white/10">
        <SidebarContent 
          setIsMobileMenuOpen={setIsMobileMenuOpen} 
          newCount={newAppointmentCount} 
          onRead={() => setNewAppointmentCount(0)}
        />
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[rgba(15,15,20,0.75)] backdrop-blur-2xl border-b border-white/10 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center text-white">
            <svg width="22" height="22" viewBox="0 0 100 100" fill="currentColor">
              <polygon points="50,0 68,32 100,50 68,68 50,100 32,68 0,50 32,32" />
            </svg>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 -mr-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/30 z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="lg:hidden fixed inset-y-0 left-0 w-64 z-50 bg-[rgba(15,15,20,0.85)] backdrop-blur-2xl border-r border-white/10"
            >
              <SidebarContent 
                setIsMobileMenuOpen={setIsMobileMenuOpen} 
                newCount={newAppointmentCount} 
                onRead={() => setNewAppointmentCount(0)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 lg:pl-56 flex flex-col min-h-screen pt-14 lg:pt-0 overflow-x-hidden text-black">
        <ToastProvider>
          <div className="flex-1 w-full">
            {children}
          </div>
        </ToastProvider>
      </main>
    </div>
  );
}

function SidebarContent({
  setIsMobileMenuOpen,
  newCount = 0,
  onRead,
}: {
  readonly setIsMobileMenuOpen: (val: boolean) => void;
  readonly newCount?: number;
  readonly onRead?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [settings, setSettings] = useState<{ name: string; avatar: string } | null>(null);

  useEffect(() => {
    async function fetchAdminProfile() {
      const { getAdminSettings } = await import('@/lib/api/settings');
      const data = await getAdminSettings();
      if (data) {
        setSettings({
          name: data.adminName || 'Jacque',
          avatar: data.adminAvatarUrl || '',
        });
      }
    }
    void fetchAdminProfile();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="px-6 py-8 flex flex-col items-center border-b border-white/10 mb-4">
        <div className="relative group mb-3">
          {settings?.avatar ? (
            <motion.img 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={settings.avatar} 
              alt="Admin" 
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/20 grayscale hover:grayscale-0 transition-all duration-500"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-white/30 ring-2 ring-white/20">
              <svg width="24" height="24" viewBox="0 0 100 100" fill="currentColor">
                <polygon points="50,0 68,32 100,50 68,68 50,100 32,68 0,50 32,32" />
              </svg>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
        </div>
        <div className="text-center">
          <span className="block font-medium text-sm text-white/90 leading-tight">
            {settings?.name || 'Jacque'}
          </span>
          <span className="text-[10px] text-white/40 font-medium uppercase tracking-widest mt-1 block">
            Administrador
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {adminLinks.map((link) => {
          const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/admin');
          const hasNewBadge = link.href === '/admin' && newCount > 0;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => { setIsMobileMenuOpen(false); if (hasNewBadge) onRead?.(); }}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white/15 text-white shadow-lg shadow-black/10'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              <link.icon size={18} className={isActive ? 'text-white' : 'text-white/40'} />
              {link.label}
              {hasNewBadge && (
                <span className={`ml-auto w-5 h-5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-red-500/80 text-white'} text-[9px] font-bold flex items-center justify-center`}>
                  {newCount > 9 ? '9+' : newCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:bg-red-500/20 hover:text-red-400 transition-colors outline-none"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
