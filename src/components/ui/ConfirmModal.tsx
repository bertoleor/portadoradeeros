import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Trash2 } from 'lucide-react';
import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = true,
}: Readonly<ConfirmModalProps>) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-md border border-black/5"
          >
            <div className="p-6 sm:p-8">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
                  isDestructive ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-black'
                }`}
              >
                {isDestructive ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
              </div>

              <h3 className="text-xl font-semibold text-black mb-2">{title}</h3>
              <p className="text-sm text-black/60 leading-relaxed mb-8">{description}</p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl border border-black/10 text-sm font-medium text-black/70 hover:bg-black/5 transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium text-white transition-colors ${
                    isDestructive
                      ? 'bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20'
                      : 'bg-black hover:bg-black/90 shadow-md shadow-black/20'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
