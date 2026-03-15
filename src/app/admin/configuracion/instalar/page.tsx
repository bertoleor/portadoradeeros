'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { BeforeInstallPromptEvent } from '@/types';

export default function InstalarAppPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => 
    typeof globalThis !== 'undefined' && !!globalThis.matchMedia?.('(display-mode: standalone)').matches
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as BeforeInstallPromptEvent);
    };

    if (typeof globalThis !== 'undefined') {
      globalThis.addEventListener?.('beforeinstallprompt', handleBeforeInstall);
    }

    return () => {
      if (typeof globalThis !== 'undefined') {
        globalThis.removeEventListener?.('beforeinstallprompt', handleBeforeInstall);
      }
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Don't redirect, just let the UI handle the "missing prompt" state
      return;
    }

    setIsLoading(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
    } catch (err) {
      console.error('PWA install error:', err);
    } finally {
      setDeferredPrompt(null);
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-4xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
              <Smartphone size={20} className="text-black/70" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-black">
              Instalar App
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-black/50 font-light max-w-md">
            Instala la aplicación en tu dispositivo para acceso rápido sin necesidad del navegador.
          </p>
        </div>

        <div className="bg-white border border-black/5 rounded-2xl shadow-sm p-6 md:p-8">
          {isInstalled ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-medium text-black mb-2">App Instalada</h2>
              <p className="text-sm text-black/50 mb-6">
                La aplicación ya está instalada en tu dispositivo.
              </p>
              <Button
                onClick={() => { if (typeof globalThis !== 'undefined' && globalThis.location) globalThis.location.href = '/admin'; }}
                variant="outline"
                className="rounded-xl"
              >
                Ir al Inicio
              </Button>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <Smartphone size={32} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-medium text-black mb-2">Descargar Aplicación</h2>
              <p className="text-sm text-black/50 mb-8 max-w-sm mx-auto">
                Para una mejor experiencia, instala la aplicación en tu pantalla de inicio.
              </p>
              
              <Button
                onClick={handleInstall}
                disabled={isLoading}
                className="rounded-xl px-10 h-12 bg-black text-white hover:bg-black/90 transition-all shadow-lg shadow-black/10"
              >
                {isLoading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <Download size={18} className="mr-2" />
                    Instalar Ahora
                  </>
                )}
              </Button>

              {!deferredPrompt && (
                <div className="mt-8 pt-8 border-t border-black/5 text-left max-w-sm mx-auto">
                  <h3 className="text-sm font-medium text-black mb-3 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px]">?</div>
                    Guía de Instalación Manual
                  </h3>
                  <div className="space-y-4 text-xs text-black/60 leading-relaxed font-light">
                    <div className="flex gap-3">
                      <span className="font-medium text-black">Chrome / Brave:</span>
                      <p>Toca los tres puntos <span className="font-bold">⋮</span> en la esquina superior y selecciona <span className="font-bold">&quot;Instalar Aplicación&quot;</span> o <span className="font-bold">&quot;Agregar a la pantalla de inicio&quot;</span>.</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-medium text-black">iPhone (Safari):</span>
                      <p>Toca el botón <span className="font-bold">Compartir</span> y selecciona <span className="font-bold">&quot;Agregar a inicio&quot;</span>.</p>
                    </div>
                    <p className="italic text-[10px] text-black/40 pt-2 border-t border-black/[0.03]">
                      Nota: Si ya la instalaste, búscala en tu cajón de aplicaciones.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
