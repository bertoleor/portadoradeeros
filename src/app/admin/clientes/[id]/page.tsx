'use client';

import { ArrowLeft, Calendar, Edit2, Mail, Phone, Plus, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button, DatePicker, Select, TimePicker } from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';
import {
  createAppointmentAdmin,
  getClientById,
  updateClient,
  type Client,
} from '@/lib/api/appointments';
import { getServices } from '@/lib/api/services';

import type { Service } from '@/types';

interface Appointment {
  id: string;
  appointment_date: string;
  status: string | null;
  notes: string | null;
  services: { title: string; duration?: number } | null;
}

const statusConfig: Record<string, { dot: string; badge: string; text: string }> = {
  confirmed: { dot: 'bg-green-500', badge: 'bg-green-50 text-green-700', text: 'Confirmado' },
  pending: { dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700', text: 'Pendiente' },
  completed: { dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700', text: 'Completado' },
  cancelled: { dot: 'bg-red-400', badge: 'bg-red-50 text-red-700', text: 'Cancelado' },
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const { success, error: toastError } = useToast();

  const [client, setClient] = useState<
    | (Client & {
        upcoming: Appointment[];
        history: Appointment[];
        cancelled: Appointment[];
        stats: {
          total: number;
          completed: number;
          cancelled: number;
          lastAppointment: string | null;
        };
      })
    | null
  >(null);
  const [services, setServices] = useState<Service[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history' | 'cancelled'>('upcoming');
  const [isLoading, setIsLoading] = useState(true);
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    notes: '',
  });

  // New appointment form
  const [apptForm, setApptForm] = useState({
    serviceId: '',
    date: '',
    time: '',
    notes: '',
  });

  // Fetch only — deliberately no setState here so the mount effect can call
  // it without tripping react-hooks/set-state-in-effect (the rule flags any
  // setState-containing function referenced from an effect callback, even
  // behind an await; nested callbacks like .then are its sanctioned form).
  const fetchClientAndServices = useCallback(async () => {
    const [clientData, servicesData] = await Promise.all([getClientById(clientId), getServices()]);
    return { clientData, servicesData };
  }, [clientId]);

  const applyData = (
    clientData: Awaited<ReturnType<typeof getClientById>>,
    servicesData: Service[]
  ) => {
    if (clientData) {
      setClient(clientData);
      setEditForm({
        name: clientData.name,
        surname: clientData.surname || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        notes: clientData.notes || '',
      });
    }
    setServices(servicesData.filter((s) => s.isVisible));
  };

  // Refetch entry point for event handlers (spinner + state updates).
  const loadData = async () => {
    setIsLoading(true);
    try {
      const { clientData, servicesData } = await fetchClientAndServices();
      applyData(clientData, servicesData);
    } catch (err) {
      toastError('Error al cargar datos');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { clientData, servicesData } = await fetchClientAndServices();
        if (active) {
          applyData(clientData, servicesData);
        }
      } catch (err) {
        if (active) {
          toastError('Error al cargar datos');
          console.error(err);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchClientAndServices, toastError]);

  const handleSaveEdit = async () => {
    try {
      const result = await updateClient(clientId, {
        name: editForm.name,
        surname: editForm.surname || undefined,
        email: editForm.email || undefined,
        phone: editForm.phone || undefined,
        notes: editForm.notes || undefined,
      });
      if (result.ok) {
        success('Datos actualizados correctamente');
        setShowEdit(false);
        loadData();
      } else {
        toastError(result.error.message || 'Error al actualizar');
      }
    } catch (err) {
      toastError((err as Error)?.message || 'Error al actualizar');
    }
  };

  const handleCreateAppointment = async () => {
    if (!apptForm.serviceId || !apptForm.date || !apptForm.time) {
      toastError('Completá todos los campos');
      return;
    }

    const selectedService = services.find((s) => s.id === apptForm.serviceId);
    const fullName = `${editForm.name} ${editForm.surname}`.trim();

    try {
      const result = await createAppointmentAdmin({
        serviceId: apptForm.serviceId,
        serviceName: selectedService?.title || '',
        serviceDuration: selectedService?.duration || 60,
        clientName: fullName,
        clientEmail: editForm.email,
        clientPhone: editForm.phone || undefined,
        clientId: clientId,
        appointmentDate: new Date(`${apptForm.date}T${apptForm.time}:00`),
        notes: apptForm.notes || undefined,
      });

      if (result.ok) {
        success('Turno creado');
        setShowNewAppt(false);
        setApptForm({ serviceId: '', date: '', time: '', notes: '' });
        loadData();
      } else {
        toastError(result.error.message || 'Error al crear turno');
      }
    } catch (err) {
      toastError((err as Error)?.message || 'Error al crear turno');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <p className="text-black/60">Cliente no encontrado</p>
        <Button onClick={() => router.push('/admin/clientes')} className="mt-4">
          Volver a clientes
        </Button>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAppointmentsByTab = () => {
    switch (activeTab) {
      case 'upcoming':
        return client.upcoming;
      case 'history':
        return client.history;
      case 'cancelled':
        return client.cancelled;
      default:
        return [];
    }
  };

  const appointments = getAppointmentsByTab();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/admin/clientes')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Volver a la lista de clientes"
          aria-label="Volver a la lista de clientes"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-light">Cliente</h1>
      </div>

      {/* Client Info Card */}
      <div className="bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-medium">
              {client.name} {client.surname}
            </h2>
            <p className="text-sm text-black/40">
              Cliente desde{' '}
              {client.created_at ? new Date(client.created_at).toLocaleDateString('es-AR') : '—'}
            </p>
          </div>
          <button
            onClick={() => setShowEdit(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Editar cliente"
            aria-label="Editar cliente"
          >
            <Edit2 size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {client.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail size={16} className="text-black/40" />
              <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                {client.email}
              </a>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone size={16} className="text-black/40" />
              <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                {client.phone}
              </a>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-black/5">
          <div className="text-center">
            <div className="text-2xl font-medium">{client.stats.total}</div>
            <div className="text-xs text-black/40">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-medium text-green-600">{client.stats.completed}</div>
            <div className="text-xs text-black/40">Completados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-medium text-red-500">{client.stats.cancelled}</div>
            <div className="text-xs text-black/40">Cancelados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-medium">
              {client.stats.lastAppointment
                ? new Date(client.stats.lastAppointment).toLocaleDateString('es-AR', {
                    month: 'short',
                    day: 'numeric',
                  })
                : '-'}
            </div>
            <div className="text-xs text-black/40">Último turno</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['upcoming', 'history', 'cancelled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'btn-primary py-2 px-4 text-sm min-h-0'
                : 'bg-white/20 text-[rgba(15,15,20,0.55)] hover:bg-white/35 border border-[rgba(15,15,20,0.08)]'
            }`}
          >
            {tab === 'upcoming' && `Próximos (${client.upcoming.length})`}
            {tab === 'history' && `Historial (${client.history.length})`}
            {tab === 'cancelled' && `Cancelados (${client.cancelled.length})`}
          </button>
        ))}
        <button
          onClick={() => setShowNewAppt(true)}
          className="btn-primary ml-auto px-4 py-2 text-sm min-h-0 flex items-center gap-2"
        >
          <Plus size={16} /> Nuevo Turno
        </button>
      </div>

      {/* Appointments List */}
      <div className="bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        {appointments.length === 0 ? (
          <div className="p-8 text-center text-black/40">
            <Calendar size={32} className="mx-auto mb-2 opacity-50" />
            <p>No hay turnos en esta categoría</p>
          </div>
        ) : (
          appointments.map((appt, idx) => {
            const config = statusConfig[appt.status ?? 'pending'] || statusConfig.pending;
            return (
              <div
                key={appt.id}
                className={`p-4 flex items-center gap-4 ${idx > 0 ? 'border-t border-black/5' : ''}`}
              >
                <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                <div className="flex-1">
                  <div className="font-medium">{appt.services?.title || 'Servicio'}</div>
                  <div className="text-sm text-black/50">{formatDate(appt.appointment_date)}</div>
                  {appt.notes && <div className="text-xs text-black/30 mt-1">{appt.notes}</div>}
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${config.badge}`}>
                  {config.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-[60]"
            onClick={() => setShowEdit(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white/85 backdrop-blur-2xl rounded-xl z-[70] p-6 border border-white/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Editar Cliente</h3>
              <button
                onClick={() => setShowEdit(false)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Cerrar"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-name" className="text-xs text-black/60 block mb-1">
                    Nombre
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Nombre"
                  />
                </div>
                <div>
                  <label htmlFor="edit-surname" className="text-xs text-black/60 block mb-1">
                    Apellido
                  </label>
                  <input
                    id="edit-surname"
                    type="text"
                    value={editForm.surname}
                    onChange={(e) => setEditForm((f) => ({ ...f, surname: e.target.value }))}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Apellido"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="edit-email" className="text-xs text-black/60 block mb-1">
                  Email
                </label>
                <input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <label htmlFor="edit-phone" className="text-xs text-black/60 block mb-1">
                  Teléfono
                </label>
                <input
                  id="edit-phone"
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Teléfono"
                />
              </div>
              <div>
                <label htmlFor="edit-notes" className="text-xs text-black/60 block mb-1">
                  Notas
                </label>
                <textarea
                  id="edit-notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  rows={2}
                  placeholder="Notas internas..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowEdit(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} className="flex-1">
                Guardar
              </Button>
            </div>
          </div>
        </>
      )}

      {/* New Appointment Modal */}
      {showNewAppt && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-[60]"
            onClick={() => setShowNewAppt(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white/85 backdrop-blur-2xl rounded-xl z-[70] p-6 border border-white/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Nuevo Turno</h3>
              <button
                onClick={() => setShowNewAppt(false)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Cerrar"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <Select
                label="Servicio *"
                value={apptForm.serviceId}
                onChange={(v) => setApptForm((f) => ({ ...f, serviceId: v }))}
                options={services.map((s) => ({
                  value: s.id,
                  label: `${s.title} (${s.duration} min)`,
                }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <DatePicker
                  label="Fecha *"
                  value={apptForm.date}
                  onChange={(v) => setApptForm((f) => ({ ...f, date: v }))}
                  min={new Date().toISOString().split('T')[0]}
                />
                <TimePicker
                  label="Hora *"
                  value={apptForm.time}
                  onChange={(v) => setApptForm((f) => ({ ...f, time: v }))}
                />
              </div>
              <div>
                <label htmlFor="appt-notes" className="text-xs text-black/60 block mb-1">
                  Notas
                </label>
                <textarea
                  id="appt-notes"
                  value={apptForm.notes}
                  onChange={(e) => setApptForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  rows={2}
                  placeholder="Notas para el turno..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowNewAppt(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleCreateAppointment} className="flex-1">
                Crear Turno
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
