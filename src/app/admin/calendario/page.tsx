'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User,
  MessageSquare,
  X,
  CheckCircle2,
  Plus,
  Ban,
  Trash2,
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button, Select, DatePicker, TimePicker } from '@/components/ui';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/ToastProvider';
import { getAppointments, confirmAppointment, completeAppointment, cancelAppointment, createAppointmentAdmin, deleteAppointment } from '@/lib/api/appointments';
import { getBlockedTimes, createBlockedTime, deleteBlockedTime, type BlockedTime } from '@/lib/api/blocked-times';
import { getServices } from '@/lib/api/services';
import { createClient } from '@/lib/supabase/client';

import type { Service } from '@/types';

interface Appointment {
  id: string;
  client_name: string;
  client_email: string;
  appointment_date: string;
  status: string;
  notes: string | null;
  services: { title: string; duration?: number } | null;
}

type ViewMode = 'month' | 'week' | 'day';

// ── New Appointment Modal ─────────────────────────────────────────────────────
interface NewApptModalProps {
  readonly services: Service[];
  readonly selectedDate?: string; // pre-fill date from calendar click
  readonly onClose: () => void;
  readonly onCreated: () => void;
}

function NewApptModal({ services, selectedDate, onClose, onCreated }: NewApptModalProps) {
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState({
    clientName: '',
    clientSurname: '',
    clientEmail: '',
    clientPhone: '',
    serviceId: services[0]?.id ?? '',
    date: selectedDate ?? '',
    time: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const selectedService = services.find(s => s.id === form.serviceId);

  const endTime = (() => {
    if (!form.time || !selectedService) {return '--:--';}
    const [h, m] = form.time.split(':').map(Number);
    const end = new Date();
    end.setHours(h, m + (selectedService.duration || 60), 0);
    return end.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  })();

  const handleSubmit = async () => {
    // Validate all required fields
    const missing: string[] = [];
    if (!form.clientName.trim()) {missing.push('nombre');}
    if (!form.clientSurname.trim()) {missing.push('apellido');}
    if (!form.clientPhone.trim()) {missing.push('teléfono');}
    if (!form.clientEmail.trim()) {missing.push('email');}
    if (!form.date) {missing.push('fecha');}
    if (!form.time) {missing.push('hora');}
    if (!form.serviceId) {missing.push('servicio');}
    
    if (missing.length > 0) {
      toastError(`Completá los campos obligatorios: ${missing.join(', ')}`);
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.clientEmail)) {
      toastError('Ingresá un email válido.');
      return;
    }

    // Validate phone format (at least 8 digits)
    const phoneDigits = form.clientPhone.replaceAll(/\D/g, '');
    if (phoneDigits.length < 8) {
      toastError('Ingresá un número de teléfono válido.');
      return;
    }

    const apptDate = new Date(`${form.date}T${form.time}:00`);
    if (Number.isNaN(apptDate.getTime())) { toastError('Fecha u hora inválida.'); return; }

    setSaving(true);
    const fullName = `${form.clientName.trim()} ${form.clientSurname.trim()}`.trim();
    try {
      const result = await createAppointmentAdmin({
        serviceId: form.serviceId,
        serviceName: selectedService?.title ?? '',
        serviceDuration: selectedService?.duration ?? 60,
        clientName: fullName,
        clientEmail: form.clientEmail.trim(),
        clientPhone: form.clientPhone.trim(),
        appointmentDate: apptDate,
        notes: form.notes || undefined,
      });
      if (result.ok) {
        success('Turno creado. Confirmación enviada al cliente.');
        onCreated();
        onClose();
      } else {
        toastError(result.error.message ?? 'Error al crear el turno.');
      }
    } catch (err) {
      toastError((err as Error)?.message || 'Error al crear el turno.');
    }
    setSaving(false);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 bg-black/30 z-[60]" />
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white/85 backdrop-blur-2xl rounded-3xl z-[70] border border-white/60 overflow-hidden">
        <div className="p-4 border-b border-[rgba(15,15,20,0.08)] flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Nuevo Turno</h3>
          <button onClick={onClose} aria-label="Cerrar" className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="p-4 space-y-3 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="cal-name" className="text-xs font-medium text-gray-600 block mb-1.5">Nombre *</label>
              <input id="cal-name" type="text" value={form.clientName}
                onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-[rgba(15,15,20,0.12)] rounded-xl bg-white/60 focus:outline-none focus:border-[rgba(15,15,20,0.35)] transition-colors" placeholder="Juan" />
            </div>
            <div>
              <label htmlFor="cal-surname" className="text-xs font-medium text-gray-600 block mb-1.5">Apellido *</label>
              <input id="cal-surname" type="text" value={form.clientSurname}
                onChange={e => setForm(f => ({ ...f, clientSurname: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-[rgba(15,15,20,0.12)] rounded-xl bg-white/60 focus:outline-none focus:border-[rgba(15,15,20,0.35)] transition-colors" placeholder="Pérez" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="cal-phone" className="text-xs font-medium text-gray-600 block mb-1.5">Teléfono *</label>
              <input id="cal-phone" type="tel" value={form.clientPhone}
                onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-[rgba(15,15,20,0.12)] rounded-xl bg-white/60 focus:outline-none focus:border-[rgba(15,15,20,0.35)] transition-colors" placeholder="+54 11..." />
            </div>
            <div>
              <label htmlFor="cal-email" className="text-xs font-medium text-gray-600 block mb-1.5">Email *</label>
              <input id="cal-email" type="email" value={form.clientEmail}
                onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-[rgba(15,15,20,0.12)] rounded-xl bg-white/60 focus:outline-none focus:border-[rgba(15,15,20,0.35)] transition-colors" placeholder="juan@email.com" />
            </div>
          </div>
          <div>
            <Select
              id="cal-service"
              label="Servicio *"
              value={form.serviceId}
              onChange={(value) => setForm(f => ({ ...f, serviceId: value }))}
              options={services.map(s => ({ value: s.id, label: `${s.title} (${s.duration} min)` }))}
              placeholder="Seleccionar servicio..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              id="cal-date"
              label="Fecha *"
              value={form.date}
              onChange={(value) => setForm(f => ({ ...f, date: value }))}
              min={new Date().toISOString().split('T')[0]}
            />
            <TimePicker
              label="Hora *"
              value={form.time}
              onChange={(value) => setForm(f => ({ ...f, time: value }))}
            />
          </div>
          {selectedService && form.time && (
            <p className="text-xs text-black/40 flex items-center gap-1">
              <Clock size={12} /> Termina a las {endTime}
            </p>
          )}
          <div>
            <label htmlFor="cal-notes" className="text-[10px] font-bold uppercase tracking-wider text-black/40 block mb-1.5">Notas</label>
            <textarea id="cal-notes" rows={2} value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-black/10 rounded-xl focus:outline-none focus:border-black resize-none" />
          </div>
        </div>
        <div className="p-6 border-t border-[rgba(15,15,20,0.08)] flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1 py-3 text-sm min-h-0">
            Cancelar
          </button>
          <Button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1 h-12 text-sm min-h-0">
            {saving ? 'Guardando...' : 'Crear Turno'}
          </Button>
        </div>
      </motion.div>
    </>
  );
}


// ── Block Time Modal ─────────────────────────────────────────────────────────────
interface BlockModalProps {
  readonly selectedDate?: string;
  readonly onClose: () => void;
  readonly onCreated: () => void;
}

function BlockModal({ selectedDate, onClose, onCreated }: BlockModalProps) {
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState({
    title: '',
    date: selectedDate ?? '',
    timeStart: '',
    timeEnd: '',
    isAllDay: true,
    type: 'blocked' as 'blocked' | 'occupied' | 'event',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.date) {
      toastError('Completá el título y la fecha');
      return;
    }

    const getBlockColor = () => {
      if (form.type === 'blocked') {return '#ef4444';}
      if (form.type === 'occupied') {return '#f59e0b';}
      return '#3b82f6';
    };

    setSaving(true);
    try {
      await createBlockedTime({
        title: form.title,
        date: form.date,
        time_start: form.isAllDay ? undefined : form.timeStart || undefined,
        time_end: form.isAllDay ? undefined : form.timeEnd || undefined,
        is_all_day: form.isAllDay,
        type: form.type,
        color: getBlockColor(),
      });
      success('Bloqueo creado correctamente');
      onCreated();
      onClose();
    } catch {
      toastError('Error al crear el bloqueo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 bg-black/30 z-[60]" />
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white/85 backdrop-blur-2xl rounded-3xl z-[70] border border-white/60 overflow-hidden">
        <div className="p-4 border-b border-[rgba(15,15,20,0.08)] flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Bloquear Fecha</h3>
          <button onClick={onClose} aria-label="Cerrar" className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label htmlFor="block-title" className="text-xs font-medium text-gray-600 block mb-1.5">Titulo *</label>
            <input
              id="block-title"
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
              placeholder="Ej: No atiendo, Turno reservado, etc."
            />
          </div>
          <div>
            <Select
              id="block-type"
              label="Tipo"
              value={form.type}
              onChange={(value) => setForm(f => ({ ...f, type: value as 'blocked' | 'occupied' | 'event' }))}
              options={[
                { value: 'blocked', label: 'Bloqueo (no atiendo)' },
                { value: 'occupied', label: 'Ocupado (reservado)' },
                { value: 'event', label: 'Evento personal' },
              ]}
              placeholder="Seleccionar tipo..."
            />
          </div>
          <div>
            <DatePicker
              id="block-date"
              label="Fecha *"
              value={form.date}
              onChange={(value) => setForm(f => ({ ...f, date: value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={form.isAllDay}
              onChange={e => setForm(f => ({ ...f, isAllDay: e.target.checked }))}
              className="rounded border-gray-200"
            />
            <label htmlFor="allDay" className="text-sm text-gray-600">Todo el dia</label>
          </div>
          {!form.isAllDay && (
            <div className="grid grid-cols-2 gap-3">
              <TimePicker
                label="Hora inicio"
                value={form.timeStart}
                onChange={(value) => setForm(f => ({ ...f, timeStart: value }))}
              />
              <TimePicker
                label="Hora fin"
                value={form.timeEnd}
                onChange={(value) => setForm(f => ({ ...f, timeEnd: value }))}
              />
            </div>
          )}
        </div>
        <div className="p-6 border-t border-[rgba(15,15,20,0.08)] flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1 py-3 text-sm min-h-0">
            Cancelar
          </button>
          <Button onClick={handleSubmit} disabled={saving} className="flex-1 bg-red-500/20 border border-red-300/40 text-red-600 rounded-full h-12 text-sm hover:bg-red-500/30 transition-all">
            {saving ? 'Guardando...' : 'Bloquear'}
          </Button>
        </div>
      </motion.div>
    </>
  );
}


// ─────────────────────────────────────────────────────────────────────────────

export default function AdminCalendario() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedDateForBlock, setSelectedDateForBlock] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const { success, error: toastError } = useToast();

  const loadData = async (isMounted = true) => {
    const [data, blocked, svc] = await Promise.all([getAppointments(), getBlockedTimes(), getServices()]);
    if (!isMounted) {return;}
    setAppointments(data || []);
    setBlockedTimes(blocked || []);
    setServices(svc.filter(sv => sv.isVisible));
    setIsLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    
    const initData = async () => {
      await loadData(mounted);
    };
    
    void initData();

    // ── Realtime: Appointments ──────────────────────────────────────
    const supabase = createClient();
    const channel = supabase
      .channel('admin-calendar-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        void getAppointments()
          .then(data => {
            if (mounted) {setAppointments(data || []);}
            return undefined;
          })
          .catch(() => undefined);
      })
      .subscribe();

    return () => { 
      mounted = false;
      supabase.removeChannel(channel); 
    };
  }, []);

  const selectedDateStr = selectedDay
    ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : undefined;

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const startOffset = firstDayOfMonth(year, month);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const appointmentsInMonth = appointments.filter(app => {
    const d = new Date(app.appointment_date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const getAppointmentsForDay = (day: number) => {
    return appointmentsInMonth.filter(app => {
      const d = new Date(app.appointment_date);
      return d.getDate() === day;
    });
  };

  // ── View Helpers ─────────────────────────────────────────────────────────────
  
  // Get week days for current week view
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Get hours for day view (8am to 8pm)
  const dayHours = Array.from({ length: 13 }, (_, i) => i + 8);

  // Check if a specific hour has an appointment
  const getAppointmentAtHour = (date: Date, hour: number) => {
    return appointments.find(app => {
      const d = new Date(app.appointment_date);
      return d.getDate() === date.getDate() && 
             d.getMonth() === date.getMonth() && 
             d.getFullYear() === date.getFullYear() &&
             d.getHours() === hour;
    });
  };

  // Check if date is blocked
  const isDateBlocked = (date: Date) => {
    return blockedTimes.some(bt => {
      const d = new Date(bt.date);
      return d.getDate() === date.getDate() && 
             d.getMonth() === date.getMonth() && 
             d.getFullYear() === date.getFullYear();
    });
  };

  const handleConfirm = async (id: string) => {
    try {
      const res = await confirmAppointment(id);
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmed' } : a));
        if (selectedAppointment?.id === id) {
          setSelectedAppointment({ ...selectedAppointment, status: 'confirmed' });
        }
        success('Turno confirmado exitosamente.');
      } else {
        toastError('Error al confirmar el turno.');
      }
    } catch {
      toastError('Error al confirmar el turno.');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const res = await completeAppointment(id);
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a));
        if (selectedAppointment?.id === id) {
          setSelectedAppointment({ ...selectedAppointment, status: 'completed' });
        }
        success('Turno marcado como completado.');
      } else {
        toastError('Error al completar el turno.');
      }
    } catch {
      toastError('Error al completar el turno.');
    }
  };

  const handleCancel = async (id: string, reason?: string) => {
    try {
      const res = await cancelAppointment(id, reason);
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
        if (selectedAppointment?.id === id) {
          setSelectedAppointment({ ...selectedAppointment, status: 'cancelled' });
        }
        success('Turno cancelado. Se ha notificado al cliente.');
      } else {
        toastError('Error al cancelar el turno.');
      }
    } catch {
      toastError('Error al cancelar el turno.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteAppointment(id);
      if (res.ok) {
        setAppointments(prev => prev.filter(a => a.id !== id));
        setSelectedAppointment(null);
        success('Turno eliminado permanentemente.');
      } else {
        toastError('Error al eliminar el turno.');
      }
    } catch {
      toastError('Error al eliminar el turno.');
    }
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      await deleteBlockedTime(id);
      setBlockedTimes(prev => prev.filter(bt => bt.id !== id));
      success('Bloqueo eliminado.');
    } catch {
      toastError('Error al eliminar el bloqueo.');
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-[1200px] mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-black mb-1">
              Calendario Maestro
            </h1>
            <p className="text-black/50 font-light text-sm">
              Gestioná tus próximas sesiones y disponibilidad.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Selector */}
            <div className="flex items-center bg-white p-1 rounded-lg border border-black/5 shadow-sm">
              {(['month', 'week', 'day'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setViewMode(v)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    viewMode === v 
                      ? 'bg-[rgba(15,15,20,0.78)] text-white shadow-sm' 
                      : 'text-black/50 hover:text-black hover:bg-white/50 backdrop-blur-sm'
                  }`}
                >
                  {v === 'month' && 'Mes'}
                  {v === 'week' && 'Semana'}
                  {v === 'day' && 'Día'}
                </button>
              ))}
            </div>
            <Button
              onClick={() => setShowNewAppt(true)}
              className="btn-primary h-9 px-4 text-xs min-h-0 py-0 flex items-center gap-1.5"
            >
              <Plus size={14} /> Nuevo Turno
            </Button>
            <Button
              onClick={() => {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay || new Date().getDate()).padStart(2, '0')}`;
                setSelectedDateForBlock(dateStr);
                setShowBlockModal(true);
              }}
              variant="outline"
              className="border border-red-300/40 text-red-500 hover:bg-red-50/50 rounded-full h-9 px-3 text-xs flex items-center gap-1.5 transition-all bg-red-500/10"
            >
              <Ban size={14} /> Bloquear
            </Button>
            <div className="flex items-center bg-white p-1 rounded-xl border border-black/5 shadow-sm">
              <button
                onClick={prevMonth}
                aria-label="Mes anterior"
                className="p-2 hover:bg-white/50 backdrop-blur-sm rounded-lg transition-all text-black/60"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="font-medium text-sm min-w-[120px] text-center">
                {monthNames[month]} {year}
              </span>
              <button
                onClick={nextMonth}
                aria-label="Mes siguiente"
                className="p-2 hover:bg-white/50 backdrop-blur-sm rounded-lg transition-all text-black/60"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Calendar Grid */}
          <div className="lg:col-span-3 bg-white/35 backdrop-blur-xl border border-white/50 rounded-2xl p-6 overflow-hidden">
            {/* Month View */}
            {viewMode === 'month' && (
              <div className="grid grid-cols-7 gap-px bg-black/5 border border-black/5 rounded-xl overflow-hidden shadow-inner">
                {dayLabels.map((day) => (
                  <div key={day} className="bg-gray-50 py-3 text-center text-[10px] font-bold text-black/40 uppercase tracking-widest">
                    {day}
                  </div>
                ))}
                
                {Array.from({ length: 42 }).map((_, i) => {
                  const dayNumber = i - startOffset + 1;
                  const isCurrentMonth = dayNumber > 0 && dayNumber <= totalDays;
                  const dayAppointments = isCurrentMonth ? getAppointmentsForDay(dayNumber) : [];
                  const isToday = isCurrentMonth && 
                                dayNumber === new Date().getDate() && 
                                month === new Date().getMonth() && 
                                year === new Date().getFullYear();

                  return (
                    <button
                      type="button"
                      key={`${year}-${month}-${i}`}
                      onClick={() => isCurrentMonth && setSelectedDay(dayNumber)}
                      className={`min-h-[110px] bg-white p-2 transition-all hover:bg-gray-50/80 cursor-pointer relative group text-left w-full ${
                        isCurrentMonth ? '' : 'bg-gray-50/30'
                      } ${selectedDay === dayNumber ? 'ring-2 ring-inset ring-black/10 bg-black/[0.02]' : ''}`}
                    >
                      <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 transition-colors ${
                        (() => {
                          if (isToday) {return 'bg-[rgba(15,15,20,0.55)] text-white backdrop-blur-sm';}
                          if (isCurrentMonth) {return 'text-black/60';}
                          return 'text-black/20';
                        })()
                      }`}>
                        {isCurrentMonth ? dayNumber : ''}
                      </span>
                      
                      {/* Blocked Day Indicator */}
                      {isCurrentMonth && blockedTimes.some(bt => {
                        const d = new Date(bt.date);
                        return d.getDate() === dayNumber && d.getMonth() === month && d.getFullYear() === year;
                      }) && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-400" title="Día bloqueado" />
                      )}
                      
                      <div className="space-y-1">
                        {dayAppointments.slice(0, 3).map((app, idx) => (
                          <button
                            key={`${app.id}-${idx}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointment(app);
                            }}
                            className={`text-[9px] px-2 py-1 rounded-md truncate border transition-all w-full text-left cursor-pointer ${
                              app.status === 'confirmed' 
                                ? 'bg-green-50 text-green-700 border-green-100' 
                                : 'bg-orange-50 text-orange-700 border-orange-100'
                            } hover:shadow-sm hover:translate-y-[-1px]`}
                          >
                            <span className="font-bold mr-1">
                              {new Date(app.appointment_date).getHours()}:00
                            </span>
                            {app.services?.title}
                          </button>
                        ))}
                        {dayAppointments.length > 3 && (
                          <div className="text-[8px] text-black/30 text-center font-medium">
                            + {dayAppointments.length - 3} más
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Week View */}
            {viewMode === 'week' && (
              <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                  {/* Week header */}
                  <div className="grid grid-cols-8 gap-2 mb-4">
                    <div className="p-2"></div>
                    {getWeekDays().map((day) => (
                      <div key={day.toISOString()} className={`text-center p-2 rounded-lg ${day.toDateString() === new Date().toDateString() ? 'bg-white/55 backdrop-blur-md border border-white/50 text-[rgba(15,15,20,0.88)]' : 'bg-white/20 backdrop-blur-sm'}`}>
                        <div className="text-xs font-medium">{dayLabels[day.getDay()]}</div>
                        <div className="text-lg font-bold">{day.getDate()}</div>
                      </div>
                    ))}
                  </div>
                  {/* Week grid */}
                  <div className="space-y-1">
                    {dayHours.map(hour => (
                      <div key={hour} className="grid grid-cols-8 gap-2">
                        <div className="text-xs text-black/40 text-right pr-2 py-3">
                          {hour}:00
                        </div>
                        {getWeekDays().map((day) => {
                          const app = getAppointmentAtHour(day, hour);
                          const blocked = isDateBlocked(day);
                          return (
                            <button
                              key={`${day.toISOString()}-${hour}`}
                              type="button"
                              className={`min-h-[50px] border rounded-lg p-1 transition-all cursor-pointer w-full text-left ${
                                (() => {
                                  if (blocked) {return 'bg-red-50 border-red-200';}
                                  if (app) {return app.status === 'confirmed' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200';}
                                  return 'bg-white border-gray-100 hover:border-gray-300';
                                })()
                              }`}
                              onClick={() => {
                                if (app) {
                                  setSelectedAppointment(app);
                                } else {
                                  setSelectedDay(day.getDate());
                                  setCurrentDate(new Date(day));
                                }
                              }}
                            >
                              {app && (
                                <div className="text-[10px] truncate font-medium">
                                  {hour}:00 - {app.services?.title || 'Servicio'}
                                </div>
                              )}
                              {blocked && !app && (
                                <div className="text-[10px] text-red-500 truncate">Bloqueado</div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Day View */}
            {viewMode === 'day' && (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium">
                    {selectedDay ? `${selectedDay} de ${monthNames[month]}` : `${new Date().getDate()} de ${monthNames[month]}`}
                  </h3>
                  <p className="text-sm text-black/40">{year}</p>
                </div>
                <div className="space-y-2">
                  {dayHours.map(hour => {
                    const dateToCheck = selectedDay ? new Date(year, month, selectedDay, hour) : new Date(year, month, new Date().getDate(), hour);
                    const app = getAppointmentAtHour(dateToCheck, hour);
                    const blocked = isDateBlocked(dateToCheck);
                    return (
                      <button
                        key={hour}
                        type="button"
                        className={`w-full flex items-center gap-4 p-4 border rounded-xl transition-all ${
                          (() => {
                            if (blocked) {return 'bg-red-50 border-red-200';}
                            if (app) {return app.status === 'confirmed' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200';}
                            return 'bg-white border-gray-100 hover:border-gray-300 cursor-pointer';
                          })()
                        }`}
                        onClick={() => {
                            if (app) {setSelectedAppointment(app);}
                            else if (!blocked) {setShowNewAppt(true);}
                        }}
                      >
                        <div className="w-16 text-sm font-medium text-black/60">
                          {hour}:00
                        </div>
                        <div className="flex-1">
                          {(() => {
                            if (app) {return <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-sm">{app.client_name}</div>
                                <div className="text-xs text-black/50">{app.services?.title}</div>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                app.status === 'confirmed' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-orange-100 text-orange-700'
                              }`}>
                                {app.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                              </span>
                            </div>;}
                            if (blocked) {return <div className="text-sm text-red-500">Día bloqueado</div>;}
                            return <div className="text-sm text-black/40">Disponible - Click para agendar</div>;
                          })()}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Agenda Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-black/5 rounded-2xl shadow-sm p-6 sticky top-6">
              <h3 className="font-medium text-black mb-6 flex items-center gap-2">
                <CalendarIcon size={18} className="text-black/40" />
                Día: {selectedDay || new Date().getDate()} de {monthNames[month]}
                {isLoading && <span className="ml-auto w-3 h-3 rounded-full border border-black/20 border-t-black/60 animate-spin" />}
              </h3>

              
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 hide-scrollbar">
                {selectedDay && getAppointmentsForDay(selectedDay).some(() => true) ? (
                  getAppointmentsForDay(selectedDay)
                    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
                    .map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedAppointment(app)}
                      className="flex gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer group w-full text-left"
                    >
                      <div className={`w-1 bg-black rounded-full transition-all group-hover:w-1.5 ${
                        app.status === 'confirmed' ? 'bg-green-500' : 'bg-orange-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium text-sm text-black">{app.services?.title}</p>
                        <p className="text-xs text-black/50 mt-0.5">{app.client_name}</p>
                        <p className="text-[10px] font-medium text-black/40 mt-2 flex items-center gap-1">
                          <Clock size={12} /> {new Date(app.appointment_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-sm text-black/30 italic">No hay turnos para este día.</p>
                  </div>
                )}
              </div>

              {/* Bloqueos del día seleccionado */}
              {selectedDay && blockedTimes.some(bt => {
                const d = new Date(bt.date);
                return d.getDate() === selectedDay && d.getMonth() === month && d.getFullYear() === year;
              }) && (
                <div className="mt-4 pt-4 border-t border-black/5">
                  <p className="text-[10px] uppercase tracking-widest text-red-400 font-bold mb-3">
                    Bloqueos
                  </p>
                  {blockedTimes
                    .filter(bt => {
                      const d = new Date(bt.date);
                      return d.getDate() === selectedDay && d.getMonth() === month && d.getFullYear() === year;
                    })
                    .map(bt => (
                      <div key={bt.id} className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100 mb-2">
                        <div>
                          <p className="text-xs font-medium text-red-700">{bt.title}</p>
                          <p className="text-[10px] text-red-400 mt-0.5">
                            {bt.is_all_day ? 'Todo el día' : `${bt.time_start} — ${bt.time_end}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteBlock(bt.id)}
                          className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-red-400 hover:text-red-600"
                          aria-label="Eliminar bloqueo"
                          title="Eliminar bloqueo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* New Appointment Modal */}
      <AnimatePresence>
        {showNewAppt && (
          <NewApptModal
            key="new-appt"
            services={services}
            selectedDate={selectedDateStr}
            onClose={() => setShowNewAppt(false)}
            onCreated={loadData}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBlockModal && (
          <BlockModal
            key="block-modal"
            selectedDate={selectedDateForBlock || undefined}
            onClose={() => {
              setShowBlockModal(false);
              setSelectedDateForBlock(null);
            }}
            onCreated={loadData}
          />
        )}
      </AnimatePresence>

      {/* Appointment Detail Modal */}
      <AnimatePresence>
        {selectedAppointment && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAppointment(null)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit bg-white rounded-3xl shadow-2xl z-[70] overflow-hidden border border-black/5"
            >
              <div className="p-6 border-b border-black/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${selectedAppointment.status === 'confirmed' ? 'bg-green-500' : 'bg-orange-500'}`} />
                  <h3 className="font-medium text-black">Detalles de la Sesión</h3>
                </div>
                <button onClick={() => setSelectedAppointment(null)} aria-label="Cerrar detalles" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={18} className="text-black/40" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                    <User size={20} className="text-black/40" />
                  </div>
                  <div>
                    <p className="text-xs text-black/40 font-medium uppercase tracking-wider mb-1">Cliente</p>
                    <p className="text-lg font-medium text-black">{selectedAppointment.client_name}</p>
                    <p className="text-sm text-black/50">{selectedAppointment.client_email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 p-6 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="text-[10px] text-black/40 font-bold uppercase mb-1">Fecha</p>
                    <p className="text-sm font-medium text-black">
                      {new Date(selectedAppointment.appointment_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-black/40 font-bold uppercase mb-1">Hora</p>
                    <p className="text-sm font-medium text-black">
                      {new Date(selectedAppointment.appointment_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-black/40 font-medium uppercase tracking-wider mb-2">Servicio</p>
                  <p className="text-md font-medium text-black">{selectedAppointment.services?.title}</p>
                </div>

                {selectedAppointment.notes && (
                  <div>
                    <p className="text-xs text-black/40 font-medium uppercase mb-2 flex items-center gap-1">
                      <MessageSquare size={14} /> Notas del Consultante
                    </p>
                    <p className="text-sm text-black/70 italic bg-gray-50/50 p-4 rounded-xl border border-black/5">
                      &quot;{selectedAppointment.notes}&quot;
                    </p>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  {selectedAppointment.status === 'confirmed' ? (
                    <Button 
                      onClick={() => handleComplete(selectedAppointment.id)}
                      className="flex-1 bg-green-500/20 border border-green-300/40 text-green-700 rounded-full h-12 text-sm hover:bg-green-500/30 transition-all"
                    >
                      <CheckCircle2 size={18} className="mr-2" /> Marcar como Completado
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleConfirm(selectedAppointment.id)}
                      className="btn-primary flex-1 h-12 text-sm min-h-0"
                    >
                      <CheckCircle2 size={18} className="mr-2" /> Confirmar Pago y Turno
                    </Button>
                  )}
                </div>

                {/* Cancel button - always show except for cancelled/completed */}
                {selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'completed' && (
                  <div className="pt-3">
                    <button
                      onClick={() => {
                        if (confirm('¿Estás segura de que quieres cancelar este turno? Se notificará al cliente.')) {
                          handleCancel(selectedAppointment.id);
                        }
                      }}
                      className="w-full py-3 text-red-500 text-sm font-medium hover:bg-red-50 rounded-xl transition-colors"
                    >
                      Cancelar Turno
                    </button>
                  </div>
                )}

                {/* Delete button - always visible now */}
                <div className="pt-3">
                  <button
                    onClick={() => setDeleteModalOpen(true)}
                    className="w-full py-2.5 text-red-400 text-xs font-medium hover:bg-red-50 rounded-xl transition-colors opacity-70 hover:opacity-100 border border-transparent hover:border-red-100 flex items-center justify-center gap-2"
                  >
                    <Trash2 size={12} />
                    Eliminar registro permanentemente
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={async () => {
          if (selectedAppointment) {
            await handleDelete(selectedAppointment.id);
            setDeleteModalOpen(false);
          }
        }}
        title="¿Eliminar turno permanentemente?"
        description={
          selectedAppointment?.status === 'confirmed'
            ? "ATENCIÓN: Este turno está CONFIRMADO. Si lo eliminas, no habrá registro histórico. Te sugerimos 'Cancelar' si quieres mantener el registro."
            : "Esta acción eliminará todos los datos de este turno de forma irreversible."
        }
        confirmText="Sí, eliminar"
        isDestructive={true}
      />
    </div>
  );
}
