'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle,
  Clock,
  Mail,
  MoreHorizontal,
  Phone,
  Sparkles,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';
import {
  confirmAppointment,
  getAppointments,
  getContactMessages,
  updateContactStatus,
} from '@/lib/api/appointments';
import { logger } from '@/lib/logger';
import { SUPPORT_WHATSAPP_URL } from '@/lib/socials';
import { createClient } from '@/lib/supabase/client';

interface AppointmentRecord {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  appointment_date: string;
  status: string;
  notes: string | null;
  services: { title: string; price: number } | null;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRecord | null>(null);
  const { success, error } = useToast();

  useEffect(() => {
    // Check if PWA is installed
    const checkPwa = () => {
      const isStandalone = globalThis.window?.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS =
        (globalThis.window?.navigator as { standalone?: boolean })?.standalone === true;
      // We could use isPwaInstalled to show/hide certain UI if needed later
      logger.debug('PWA status:', { installed: isStandalone || isInWebAppiOS });
    };
    checkPwa();

    // Listen for display mode changes
    const mediaQuery = globalThis.window?.matchMedia('(display-mode: standalone)');
    if (mediaQuery) {
      const handleChange = () => checkPwa();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const renderAppointments = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/30 backdrop-blur-sm"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-8 w-20 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      );
    }
    if (appointments.length === 0) {
      return <div className="py-8 text-center text-gray-400 text-sm">No hay turnos agendados.</div>;
    }
    return (
      <div className="space-y-3">
        {appointments.slice(0, 5).map((app) => (
          <div
            key={app.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-white/30 backdrop-blur-sm hover:bg-white/50 transition-all gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gray-200 flex flex-col items-center justify-center shrink-0">
                <span className="text-[8px] font-medium text-gray-500 uppercase">
                  {new Date(app.appointment_date).toLocaleDateString('es-AR', { month: 'short' })}
                </span>
                <span className="text-xs font-semibold text-gray-700">
                  {new Date(app.appointment_date).getDate()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{app.client_name}</p>
                <p className="text-xs text-gray-500 truncate">{app.services?.title}</p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100">
              <div className="text-left sm:text-right">
                <p className="text-xs font-medium text-gray-600">
                  {new Date(app.appointment_date).getHours()}:00 hs
                </p>
                <span
                  className={`text-[9px] font-medium ${app.status === 'confirmed' ? 'text-green-600' : 'text-orange-500'}`}
                >
                  {app.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {app.status !== 'confirmed' && (
                  <Button
                    onClick={() => handleConfirm(app.id)}
                    disabled={isConfirming === app.id}
                    size="sm"
                    variant="default"
                    className="h-8 px-3 text-xs min-h-0"
                  >
                    Confirmar
                  </Button>
                )}
                <Button
                  onClick={() => setSelectedAppointment(app)}
                  variant="outline"
                  size="icon-xs"
                  className="w-8 h-8"
                >
                  <MoreHorizontal size={14} className="text-gray-500" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMessages = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-white/30 backdrop-blur-sm rounded-xl animate-pulse" />
          ))}
        </div>
      );
    }
    if (messages.length === 0) {
      return <div className="text-center py-8 text-gray-400 text-sm">No hay mensajes.</div>;
    }
    return (
      <div className="space-y-2">
        {messages.slice(0, 4).map((msg) => (
          <motion.div
            key={msg.id}
            onClick={() => markAsRead(msg.id)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              msg.status === 'unread'
                ? 'bg-white/50 border-white/60 backdrop-blur-sm'
                : 'bg-white/30 border-white/40 backdrop-blur-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase">{msg.name}</span>
              <span className="text-[10px] text-gray-400">
                {new Date(msg.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-xs text-gray-600 line-clamp-2 mb-2">{msg.message}</p>
            {msg.status === 'unread' && (
              <div className="flex items-center gap-1 text-[10px] font-medium text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Sin leer
              </div>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    async function loadData() {
      const [appts, msgs] = await Promise.all([getAppointments(), getContactMessages()]);
      setAppointments(appts || []);
      setMessages(msgs || []);
      setIsLoading(false);
    }
    loadData();

    // ── Realtime: Messages ──────────────────────────────────────────
    const supabase = createClient();
    const messageChannel = supabase
      .channel('dashboard-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, () => {
        void getContactMessages().then((msgs) => setMessages(msgs || []));
      })
      .subscribe();

    // ── Realtime: Appointments ──────────────────────────────────────
    const appointmentChannel = supabase
      .channel('dashboard-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        void getAppointments().then((appts) => setAppointments(appts || []));
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(messageChannel);
      void supabase.removeChannel(appointmentChannel);
    };
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleConfirm = async (id: string) => {
    setIsConfirming(id);
    try {
      const result = await confirmAppointment(id);
      if (result.ok) {
        setAppointments((prev) =>
          prev.map((app) => (app.id === id ? { ...app, status: 'confirmed' } : app))
        );
        success('Turno confirmado y email enviado.');
      } else {
        error(`Error: ${result.error.message || 'Intenta nuevamente.'}`);
      }
    } catch (err) {
      error(`Error: ${(err as Error)?.message || 'Intenta nuevamente.'}`);
    }
    setIsConfirming(null);
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await updateContactStatus(id, 'read');
      if (res.ok) {
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'read' } : m)));
      }
    } catch {
      // best-effort: ignore failures updating the read flag
    }
  };

  const getServicePopularity = () => {
    const counts: Record<string, number> = {};
    appointments
      .filter((app) => {
        const d = new Date(app.appointment_date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      })
      .forEach((a) => {
        const title = a.services?.title || 'Otros';
        counts[title] = (counts[title] || 0) + 1;
      });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  };

  const getEstimatedIncome = () => {
    return appointments
      .filter((app) => {
        const d = new Date(app.appointment_date);
        return (
          d.getMonth() === selectedMonth &&
          d.getFullYear() === selectedYear &&
          (app.status === 'confirmed' || app.status === 'completed')
        );
      })
      .reduce((sum, app) => sum + (app.services?.price || 0), 0);
  };

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const stats = [
    {
      label: 'Servicio Popular',
      value: getServicePopularity()[0]?.[0] || 'Sin datos',
      icon: Sparkles,
      sublabel: monthNames[selectedMonth],
    },
    {
      label: 'Ingresos Est.',
      value: `$${getEstimatedIncome().toLocaleString('es-AR')}`,
      icon: CheckCircle,
      sublabel: 'Confirmados/OK',
    },
    {
      label: 'Pendientes',
      value: appointments.filter((a) => a.status === 'pending').length.toString(),
      icon: Clock,
      sublabel: 'Por confirmar',
    },
    {
      label: 'Total Turnos',
      value: appointments.length.toString(),
      icon: Calendar,
      sublabel: 'Histórico',
    },
  ];

  const yearOptions = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - 1 + i);

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-medium text-gray-900 mb-1">
              Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Gestión de métricas y turnos próximos
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-white/50 backdrop-blur-sm border border-black/5 rounded-xl p-1">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-xs font-medium px-2 py-1 focus:outline-none cursor-pointer"
                aria-label="Seleccionar mes"
              >
                {monthNames.map((name, i) => (
                  <option key={name} value={i}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-xs font-medium px-2 py-1 border-l border-black/5 focus:outline-none cursor-pointer"
                aria-label="Seleccionar año"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium bg-white/30 px-3 py-1.5 rounded-full border border-white/50">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Sincronizado
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="bg-white/35 backdrop-blur-xl border border-white/50 p-4 md:p-5 rounded-lg group hover:bg-white/45 transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                <stat.icon
                  size={16}
                  className="text-gray-400 group-hover:text-black transition-colors"
                />
                <p className="text-xs font-medium text-gray-500">{stat.label}</p>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {stat.value === 'Sin datos' ? (
                  <span className="text-gray-400 font-normal italic text-sm">{stat.value}</span>
                ) : (
                  stat.value
                )}
              </h3>
              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">
                {stat.sublabel}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Area: Appointments */}
          <div className="xl:col-span-2 space-y-6">
            <section className="bg-white/35 backdrop-blur-xl border border-white/50 rounded-lg p-5 md:p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-medium text-gray-900 flex items-center gap-2">
                  <Calendar size={18} className="text-gray-400" />
                  Próximas Sesiones
                </h2>
                <Link
                  href="/admin/calendario"
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Ver todo
                </Link>
              </div>

              {renderAppointments()}
            </section>
          </div>

          {/* Sidebar: Unread Messages */}
          <div className="space-y-6">
            <section className="bg-white/35 backdrop-blur-xl rounded-lg p-5 md:p-6">
              <h2 className="text-base font-medium text-gray-900 mb-5 flex items-center gap-2">
                <Mail size={18} className="text-gray-400" />
                Mensajes
              </h2>

              {renderMessages()}
            </section>

            <section className="bg-white/35 backdrop-blur-xl border border-white/50 rounded-2xl p-5 md:p-6">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-[rgba(15,15,20,0.85)]">
                Soporte
                <Sparkles size={14} className="text-[rgba(15,15,20,0.30)]" />
              </h3>
              <p className="text-xs text-[rgba(15,15,20,0.50)] leading-relaxed mb-4">
                ¿Necesitas ayuda? Escríbenos y te orientamos.
              </p>
              <a
                href={SUPPORT_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full text-center block text-xs py-2.5"
              >
                Contactar
              </a>
            </section>
          </div>
        </div>
      </motion.div>

      {/* Appointment Details Modal */}
      <AnimatePresence>
        {selectedAppointment && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAppointment(null)}
              className="fixed inset-0 bg-black/30 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white/85 backdrop-blur-2xl rounded-2xl z-[60] overflow-hidden border border-white/60"
            >
              <div className="p-4 border-b border-[rgba(15,15,20,0.08)] flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Detalles del Turno</h3>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg"
                  aria-label="Cerrar"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center font-semibold text-gray-700">
                    {new Date(selectedAppointment.appointment_date).getDate()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedAppointment.client_name}</p>
                    <p className="text-sm text-gray-500">{selectedAppointment.client_email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Fecha</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedAppointment.appointment_date).toLocaleDateString('es-AR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Hora</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedAppointment.appointment_date).toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Servicio</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedAppointment.services?.title}
                  </p>
                </div>

                {selectedAppointment.client_phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} className="text-gray-400" />
                    <p>{selectedAppointment.client_phone}</p>
                  </div>
                )}

                {selectedAppointment.notes && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Notas</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2.5 rounded-lg">
                      {selectedAppointment.notes}
                    </p>
                  </div>
                )}

                <div
                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                    selectedAppointment.status === 'confirmed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {selectedAppointment.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
