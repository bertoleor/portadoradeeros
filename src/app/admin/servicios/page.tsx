'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ServiceIcon } from '@/components/ui/ServiceIcons';
import { useToast } from '@/components/ui/ToastProvider';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { getServices, deleteService } from '@/lib/api/services';
import type { Service } from '@/types';

const BULK_ACTION = 'bulk';

export default function AdminServicios() {
  const [servicios, setServicios] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  const { success } = useToast();

  useEffect(() => {
    async function loadServices() {
      const data = await getServices();
      setServicios(data);
      setIsLoading(false);
    }
    void loadServices();
  }, []);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(servicios.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const confirmDelete = (id: string) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmBulkDelete = () => {
    setItemToDelete(BULK_ACTION);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    try {
      if (itemToDelete === BULK_ACTION) {
        for (const id of selectedIds) {
          await deleteService(id);
        }
        setServicios(prev => prev.filter(s => !selectedIds.includes(s.id)));
        success(`${selectedIds.length} servicios eliminados correctamente.`);
        setSelectedIds([]);
      } else if (itemToDelete) {
        await deleteService(itemToDelete);
        setServicios(prev => prev.filter(s => s.id !== itemToDelete));
        success('Servicio eliminado correctamente.');
        setSelectedIds(prev => prev.filter(id => id !== itemToDelete));
      }
    } catch (err) {
      console.error('Error deleting service:', err);
      success('Error al eliminar servicio.');
    }
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const isBulkDelete = itemToDelete === BULK_ACTION;
  const confirmModalTitle = isBulkDelete ? '¿Eliminar servicios seleccionados?' : '¿Eliminar servicio?';
  const confirmModalDescription = isBulkDelete
    ? `Estás por eliminar ${selectedIds.length} servicios. Esta acción no se puede deshacer y los servicios desaparecerán del sitio público inmediatamente.`
    : 'Esta acción no se puede deshacer y el servicio desaparecerá del sitio público inmediatamente.';

  const renderTableBody = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
            Cargando...
          </td>
        </tr>
      );
    }
    if (servicios.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="px-4 py-8 text-center text-gray-400 font-medium">
            No hay servicios cargados.
          </td>
        </tr>
      );
    }
    return servicios.map((service) => {
      const isSelected = selectedIds.includes(service.id);
      const rowBg = isSelected ? 'bg-black/[0.02]' : '';
      const statusClasses = service.isVisible
        ? 'bg-green-50 text-green-700 border border-green-200/50'
        : 'bg-black/5 text-black/50 border border-black/10';

      return (
        <tr key={service.id} className={`hover:bg-black/[0.02] transition-colors group ${rowBg}`}>
          <td className="px-6 py-4">
            <input
              type="checkbox"
              title={`Seleccionar ${service.title}`}
              aria-label={`Seleccionar ${service.title}`}
              className="rounded border-black/20 text-black focus:ring-black cursor-pointer"
              checked={isSelected}
              onChange={() => handleSelectOne(service.id)}
            />
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                <ServiceIcon type={service.icon} size={20} />
              </div>
              <div>
                <p className="font-medium text-black text-sm">{service.title}</p>
                <p className="text-xs text-black/40 truncate max-w-[200px]">{service.shortDescription}</p>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 text-sm text-black/60 hidden sm:table-cell">
            ${service.price}
          </td>
          <td className="px-6 py-4 text-sm text-black/60 hidden md:table-cell">
            {service.duration} min
          </td>
          <td className="px-6 py-4">
            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${statusClasses}`}>
              {service.isVisible ? 'Público' : 'Oculto'}
            </span>
          </td>
          <td className="px-6 py-4 text-right">
            <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <Link
                href={`/admin/servicios/${service.slug}`}
                className="p-2 text-black/40 hover:text-black hover:bg-black/5 rounded-lg transition-colors"
                title="Editar"
              >
                <Edit3 size={16} />
              </Link>
              <button
                onClick={() => confirmDelete(service.id)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </td>
        </tr>
      );
    });
  };

  const renderMobileCards = () => {
    if (isLoading) return <div className="py-12 text-center text-black/20">Cargando oráculo...</div>;
    if (servicios.length === 0) return <div className="py-12 text-center text-black/20 italic">Buzón de servicios vacío.</div>;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
        {servicios.map((s) => (
          <div key={s.id} className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                  <ServiceIcon type={s.icon} size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-black">{s.title}</h3>
                  <p className="text-[10px] text-black/40 uppercase font-bold tracking-wider">${s.price} • {s.duration} min</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.isVisible ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-black/30'}`}>
                {s.isVisible ? 'Público' : 'Oculto'}
              </span>
            </div>
            <p className="text-xs text-black/50 line-clamp-2 leading-relaxed italic">&quot;{s.shortDescription}&quot;</p>
            <div className="pt-2 flex items-center gap-2">
              <Link href={`/admin/servicios/${s.slug}`} className="flex-1 py-2 text-center text-xs font-bold border border-black/5 rounded-xl hover:bg-black/5 transition-colors">Editar</Link>
              <button onClick={() => confirmDelete(s.id)} className="flex-1 py-2 text-center text-xs font-bold bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors">Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={executeDelete}
        title={confirmModalTitle}
        description={confirmModalDescription}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        isDestructive={true}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-black mb-1">
              Servicios
            </h1>
            <p className="text-black/50 font-light text-sm">
              Administrá los servicios que ofrecés en tu sitio.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <AnimatePresence>
              {selectedIds.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={confirmBulkDelete}
                  className="inline-flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-red-100 transition-all"
                >
                  <Trash2 size={16} />
                  Eliminar ({selectedIds.length})
                </motion.button>
              )}
            </AnimatePresence>
            <Link href="/admin/servicios/nuevo" className="inline-flex items-center justify-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-black/90 active:scale-95 transition-all shadow-md shadow-black/10">
              <Plus size={16} />
              Nuevo Servicio
            </Link>
          </div>
        </div>

        <div className="bg-white border border-black/5 rounded-2xl shadow-sm overflow-hidden text-black">
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/5 bg-white">
                  <th className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      title="Seleccionar todos los servicios"
                      aria-label="Seleccionar todos los servicios"
                      className="rounded border-black/20 text-black focus:ring-black cursor-pointer"
                      checked={servicios.length > 0 && selectedIds.length === servicios.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-black/40 uppercase tracking-widest">Servicio</th>
                  <th className="px-6 py-4 text-xs font-semibold text-black/40 uppercase tracking-widest hidden sm:table-cell">Precio</th>
                  <th className="px-6 py-4 text-xs font-semibold text-black/40 uppercase tracking-widest hidden md:table-cell">Duración</th>
                  <th className="px-6 py-4 text-xs font-semibold text-black/40 uppercase tracking-widest">Estado</th>
                  <th className="px-6 py-4 text-xs font-semibold text-black/40 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {renderTableBody()}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards (shown up to lg breakpoint) */}
          <div className="lg:hidden p-4">
            {renderMobileCards()}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
