'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Calendar, 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  MoreHorizontal,
  Mail,
  X,
  Phone,
} from 'lucide-react';
import { getAppointments, confirmAppointment, getContactMessages, updateContactStatus } from '@/lib/api/appointments';
import { useToast } from '@/components/ui/ToastProvider';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

interface AppointmentRecord {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  appointment_date: string;
  status: string;
  notes: string | null;
  services: { title: string } | null;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
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
      const isInWebAppiOS = (globalThis.window?.navigator as { standalone?: boolean })?.standalone === true;
      // We could use isPwaInstalled to show/hide certain UI if needed later
      console.debug('PWA status:', isStandalone || isInWebAppiOS);
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
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
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
          <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-gray-50/50 hover:bg-gray-100 transition-colors gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gray-200 flex flex-col items-center justify-center shrink-0">
                <span className="text-[8px] font-medium text-gray-500 uppercase">{new Date(app.appointment_date).toLocaleDateString('es-AR', { month: 'short' })}</span>
                <span className="text-xs font-semibold text-gray-700">{new Date(app.appointment_date).getDate()}</span>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{app.client_name}</p>
                <p className="text-xs text-gray-500 truncate">{app.services?.title}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100">
              <div className="text-left sm:text-right">
                <p className="text-xs font-medium text-gray-600">{new Date(app.appointment_date).getHours()}:00 hs</p>
                <span className={`text-[9px] font-medium ${app.status === 'confirmed' ? 'text-green-600' : 'text-orange-500'}`}>
                  {app.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {app.status !== 'confirmed' && (
                  <Button
                    onClick={() => handleConfirm(app.id)}
                    disabled={isConfirming === app.id}
                    size="sm"
                    className="h-8 px-3 text-xs"
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
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" />
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
                ? 'bg-gray-50 border-gray-200'
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase">{msg.name}</span>
              <span className="text-[10px] text-gray-400">{new Date(msg.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
              {msg.message}
            </p>
            {msg.status === 'unread' && (
              <div className="flex items-center gap-1 text-[10px] font-medium text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />Sin leer
              </div>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    async function loadData() {
      const [appts, msgs] = await Promise.all([
        getAppointments(),
        getContactMessages()
      ]);
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
        void getContactMessages().then(msgs => setMessages(msgs || []));
      })
      .subscribe();

    // ── Realtime: Appointments ──────────────────────────────────────
    const appointmentChannel = supabase
      .channel('dashboard-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        void getAppointments().then(appts => setAppointments(appts || []));
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(messageChannel);
      void supabase.removeChannel(appointmentChannel);
    };
  }, []);

  const handleConfirm = async (id: string) => {
    setIsConfirming(id);
    const result = await confirmAppointment(id);
    if (result.success) {
      setAppointments(prev => prev.map(app => app.id === id ? { ...app, status: 'confirmed' } : app));
      success('Turno confirmado y email enviado.');
    } else {
      error(`Error: ${result.error || 'Intenta nuevamente.'}`);
    }
    setIsConfirming(null);
  };

  const markAsRead = async (id: string) => {
    const res = await updateContactStatus(id, 'read');
    if (res.success) {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'read' } : m));
    }
  };

  const getServicePopularity = () => {
    const counts: Record<string, number> = {};
    appointments.forEach(a => {
      const title = a.services?.title || 'Otros';
      counts[title] = (counts[title] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  };

  const stats = [
    { label: 'Servicio Popular', value: getServicePopularity()[0]?.[0] || 'Sin datos', icon: Sparkles, sublabel: 'Este mes' },
    { label: 'Pendientes', value: appointments.filter(a => a.status === 'pending').length.toString(), icon: Clock, sublabel: 'Por confirmar' },
    { label: 'Mensajes', value: messages.filter(m => m.status === 'unread').length.toString(), icon: MessageSquare, sublabel: 'Sin leer' },
    { label: 'Total Turnos', value: appointments.length.toString(), icon: CheckCircle, sublabel: 'Histórico' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full">
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
              Aquí tienes un resumen de tu actividad
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-500" />Sincronizado
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
              className="bg-gray-50/50 p-4 md:p-5 rounded-lg border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-3">
                <stat.icon size={16} className="text-gray-400" />
                <p className="text-xs font-medium text-gray-500">{stat.label}</p>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 truncate">{stat.value}</h3>
              <p className="text-[10px] text-gray-400 mt-1">{stat.sublabel}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Area: Appointments */}
          <div className="xl:col-span-2 space-y-6">
            <section className="bg-gray-50/50 rounded-lg p-5 md:p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-medium text-gray-900 flex items-center gap-2">
                  <Calendar size={18} className="text-gray-400" />
                  Próximas Sesiones
                </h2>
                <Link href="/admin/calendario" className="text-xs text-gray-500 hover:text-gray-700">Ver todo</Link>
              </div>

              {renderAppointments()}
            </section>
          </div>

          {/* Sidebar: Unread Messages */}
          <div className="space-y-6">
            <section className="bg-gray-50/50 rounded-lg p-5 md:p-6">
              <h2 className="text-base font-medium text-gray-900 mb-5 flex items-center gap-2">
                <Mail size={18} className="text-gray-400" />
                Mensajes
              </h2>

              {renderMessages()}
            </section>

            <section className="bg-gray-900 rounded-xl p-5 md:p-6 text-white">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                Soporte
                <Sparkles size={14} className="text-gray-500" />
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                ¿Necesitas ayuda? Escríbenos y te orientamos.
              </p>
              <a 
                href="https://wa.me/5491173643504" 
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-white text-gray-900 hover:bg-gray-100 text-xs py-2.5 rounded-lg text-center font-medium"
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
              className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white rounded-xl z-[60] overflow-hidden border border-gray-200"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
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
                      {new Date(selectedAppointment.appointment_date).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Hora</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedAppointment.appointment_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Servicio</p>
                  <p className="text-sm font-medium text-gray-900">{selectedAppointment.services?.title}</p>
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
                    <p className="text-sm text-gray-600 bg-gray-50 p-2.5 rounded-lg">{selectedAppointment.notes}</p>
                  </div>
                )}

                <div className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                  selectedAppointment.status === 'confirmed' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
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
