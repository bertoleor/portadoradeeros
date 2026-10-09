'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Check, X } from 'lucide-react';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

import type { ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  readonly id: string;
  readonly message: string;
  readonly type: ToastType;
}

interface ToastContextType {
  readonly toast: (message: string, type?: ToastType) => void;
  readonly success: (message: string) => void;
  readonly error: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { readonly children: ReactNode }) {
  const [toasts, setToasts] = useState<readonly Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = Math.random().toString(36).substring(7);
      setToasts((prev) => [...prev, { id, message, type }]);

      const timer = setTimeout(() => removeToast(id), 4000);
      return () => clearTimeout(timer);
    },
    [removeToast]
  );

  const success = useCallback((message: string) => addToast(message, 'success'), [addToast]);
  const error = useCallback((message: string) => addToast(message, 'error'), [addToast]);
  const contextValue = useMemo(
    () => ({
      toast: addToast,
      success,
      error,
    }),
    [addToast, success, error]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl shadow-black/5 border border-black/5 backdrop-blur-md min-w-[280px] ${
                t.type === 'error'
                  ? 'bg-red-50 text-red-900 border-red-100'
                  : 'bg-white/90 text-black'
              }`}
            >
              <div
                className={cn(
                  'flex items-center justify-center shrink-0 w-8 h-8 rounded-xl',
                  t.type === 'success' && 'bg-black text-white',
                  t.type === 'error' && 'bg-red-500 text-white',
                  t.type === 'info' && 'bg-gray-100 text-black'
                )}
              >
                {t.type === 'success' && <Check size={16} strokeWidth={3} />}
                {t.type === 'error' && <AlertCircle size={16} strokeWidth={2.5} />}
                {t.type === 'info' && <Check size={16} />}
              </div>
              <p className="text-sm font-medium flex-1">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                aria-label="Cerrar notificación"
                className="p-1 -mr-1 rounded-lg hover:bg-black/5 text-black/40 hover:text-black transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
