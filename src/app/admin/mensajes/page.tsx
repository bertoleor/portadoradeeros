'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Check, Archive, X, Send, ArrowLeft, MessageSquare, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { useToast } from '@/components/ui/ToastProvider';
import { getContactMessages, updateContactStatus } from '@/lib/api/appointments';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string | null;
  created_at: string;
}

export default function AdminMensajes() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'archived'>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const { success } = useToast();

  useEffect(() => {
    async function loadMessages() {
      const data = await getContactMessages();
      setMessages(data || []);
      setIsLoading(false);
    }
    loadMessages();
  }, []);

  const filteredMessages = messages.filter(msg => {
    if (filter === 'all') return true;
    return msg.status === filter;
  });

  const handleStatusChange = async (id: string, newStatus: 'read' | 'archived') => {
    try {
      const res = await updateContactStatus(id, newStatus);
      if (res.ok) {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
        if (selectedMessage?.id === id) {
          setSelectedMessage({ ...selectedMessage, status: newStatus });
        }
        success(`Mensaje movido a ${newStatus === 'read' ? 'leídos' : 'archivados'}.`);
      }
    } catch {
      // best-effort: ignore failures moving message status
    }
  };

  const unreadCount = messages.filter(m => m.status === 'unread').length;
  const archivedCount = messages.filter(m => m.status === 'archived').length;

  const renderMessageList = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse" />)}
        </div>
      );
    }
    if (filteredMessages.length === 0) {
      return (
        <div className="py-24 text-center">
          <Mail size={48} className="mx-auto text-black/10 mb-4" />
          <p className="text-black/30 italic text-sm">No hay mensajes {filter === 'all' ? 'todavía' : 'en esta categoría'}.</p>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {filteredMessages.map((msg) => (
          <motion.div
            key={msg.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedMessage(msg)}
            className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all group ${
              msg.status === 'unread' 
                ? 'border-white/60 bg-white/50 backdrop-blur-sm' 
                : 'border-white/40 text-gray-600 hover:bg-white/30 backdrop-blur-sm'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                msg.status === 'unread' ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <Mail size={16} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-gray-900 truncate">{msg.name}</p>
                  {msg.status === 'unread' && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                </div>
                <p className={`text-xs truncate flex items-center gap-1 mt-0.5 ${
                  msg.status === 'unread' ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  <MessageSquare size={11} />
                  <span className="truncate">{msg.message}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden sm:block text-right">
                <p className={`text-[10px] ${
                  msg.status === 'unread' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {new Date(msg.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <ChevronRight size={16} className={`transition-all ${
                msg.status === 'unread' ? 'text-gray-400' : 'text-gray-300 group-hover:text-gray-500'
              }`} />
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Link 
              href="/admin"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors"
            >
              <ArrowLeft size={16} /> Volver
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">
              Mensajes
            </h1>
            <p className="text-sm text-gray-500">
              Gestión de mensajes recibidos.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              filter === 'all' 
                ? 'btn-primary py-2 px-4 text-sm min-h-0' 
                : 'bg-white/30 backdrop-blur-sm border border-[rgba(15,15,20,0.12)] text-[rgba(15,15,20,0.60)] hover:bg-white/50'
            }`}
          >
            Todos ({messages.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              filter === 'unread' 
                ? 'btn-primary py-2 px-4 text-sm min-h-0' 
                : 'bg-white/30 backdrop-blur-sm border border-[rgba(15,15,20,0.12)] text-[rgba(15,15,20,0.60)] hover:bg-white/50'
            }`}
          >
            No leídos ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              filter === 'read' 
                ? 'btn-primary py-2 px-4 text-sm min-h-0' 
                : 'bg-white/30 backdrop-blur-sm border border-[rgba(15,15,20,0.12)] text-[rgba(15,15,20,0.60)] hover:bg-white/50'
            }`}
          >
            Leídos
          </button>
          <button
            onClick={() => setFilter('archived')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              filter === 'archived' 
                ? 'btn-primary py-2 px-4 text-sm min-h-0' 
                : 'bg-white/30 backdrop-blur-sm border border-[rgba(15,15,20,0.12)] text-[rgba(15,15,20,0.60)] hover:bg-white/50'
            }`}
          >
            Archivados ({archivedCount})
          </button>
        </div>

        {renderMessageList()}
      </motion.div>

      {/* Message Detail Modal */}
      <AnimatePresence>
        {selectedMessage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMessage(null)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-2xl h-fit bg-white/85 backdrop-blur-2xl rounded-3xl shadow-2xl z-[60] border border-white/60 overflow-hidden"
            >
              <div className="p-6 border-b border-black/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedMessage.status === 'unread' ? 'bg-gray-100 text-gray-700' : 'bg-gray-50 text-gray-400'
                  }`}>
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <h3 className="font-medium text-black">{selectedMessage.name}</h3>
                    <p className="text-sm text-black/50">{selectedMessage.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedMessage(null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  aria-label="Cerrar"
                >
                  <X size={18} className="text-black/40" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4 text-sm text-black/50">
                  <span>Recibido: {new Date(selectedMessage.created_at).toLocaleDateString('es-AR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>

                {selectedMessage.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-black/40">Teléfono:</span>
                    <a href={`tel:${selectedMessage.phone}`} className="text-black hover:underline">
                      {selectedMessage.phone}
                    </a>
                  </div>
                )}

                <div className="p-5 bg-gray-50 rounded-2xl border border-black/5">
                  <p className="text-sm text-black/70 italic leading-relaxed">
                    &quot;{selectedMessage.message}&quot;
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: Tu mensaje desde Portadora de Eros`}
                    className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm min-h-0"
                  >
                    <Send size={16} />
                    Responder por email
                  </a>

                  {selectedMessage.status !== 'read' && (
                    <button
                      onClick={() => handleStatusChange(selectedMessage.id, 'read')}
                      className="btn-outline inline-flex items-center gap-2 px-4 py-2 text-sm min-h-0"
                    >
                      <Check size={16} />
                      Marcar como leído
                    </button>
                  )}

                  {selectedMessage.status !== 'archived' && (
                    <button
                      onClick={() => handleStatusChange(selectedMessage.id, 'archived')}
                      className="btn-outline inline-flex items-center gap-2 px-4 py-2 text-sm min-h-0"
                    >
                      <Archive size={16} />
                      Archivar
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
