'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { BeforeInstallPromptEvent } from '@/types';

// iOS detection
// iOS detection
function isIOS() {
  if (globalThis.navigator === undefined) return false;
  return /iPad|iPhone|iPod/.test(globalThis.navigator.userAgent) && !((globalThis as unknown as { MSStream?: unknown }).MSStream);
}

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

        <div className="bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl shadow-sm p-6 md:p-8">
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
              <h2 className="text-xl font-medium text-black mb-2">Instalar App</h2>
              
              {(() => {
                if (isIOS()) {
                  return (
                    <div className="mt-6 text-left max-w-sm mx-auto space-y-4">
                      <p className="text-sm text-black/60 text-center mb-6">
                        En iPhone/iPad la instalación es manual:
                      </p>
                      <div className="flex gap-3 p-4 bg-gray-50 rounded-2xl">
                        <span className="text-lg shrink-0">1</span>
                        <p className="text-sm text-black/70">
                          Tocá el botón <strong>Compartir</strong>{' '}
                          <span className="inline-block mx-1">⎙</span>{' '}
                          en la barra inferior de Safari
                        </p>
                      </div>
                      <div className="flex gap-3 p-4 bg-gray-50 rounded-2xl">
                        <span className="text-lg shrink-0">2</span>
                        <p className="text-sm text-black/70">
                          Buscá y tocá <strong>&quot;Agregar a pantalla de inicio&quot;</strong>
                        </p>
                      </div>
                      <div className="flex gap-3 p-4 bg-gray-50 rounded-2xl">
                        <span className="text-lg shrink-0">3</span>
                        <p className="text-sm text-black/70">
                          Tocá <strong>&quot;Agregar&quot;</strong> en la esquina superior derecha
                        </p>
                      </div>
                      <p className="text-xs text-black/35 text-center mt-4 italic">
                        Asegurate de estar en Safari — otros browsers en iOS no soportan instalación
                      </p>
                    </div>
                  );
                }

                if (deferredPrompt) {
                  return (
                    <>
                      <p className="text-sm text-black/50 mb-8 max-w-sm mx-auto">
                        Instalá la app en tu pantalla de inicio para acceso rápido.
                      </p>
                      <Button
                        onClick={handleInstall}
                        disabled={isLoading}
                        className="rounded-xl px-10 h-12 bg-black text-white hover:bg-black/90 transition-all"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                          <><Download size={18} className="mr-2" /> Instalar Ahora</>
                        )}
                      </Button>
                    </>
                  );
                }

                return (
                  <div className="mt-6 text-left max-w-sm mx-auto space-y-4">
                    <p className="text-sm text-black/60 text-center mb-4">
                      Instalación manual desde el browser:
                    </p>
                    <div className="flex gap-3 p-4 bg-gray-50 rounded-2xl">
                      <span className="text-lg shrink-0">1</span>
                      <p className="text-sm text-black/70">
                        En Chrome: tocá los <strong>tres puntos ⋮</strong> arriba a la derecha
                      </p>
                    </div>
                    <div className="flex gap-3 p-4 bg-gray-50 rounded-2xl">
                      <span className="text-lg shrink-0">2</span>
                      <p className="text-sm text-black/70">
                        Seleccioná <strong>&quot;Instalar aplicación&quot;</strong> o <strong>&quot;Agregar a pantalla de inicio&quot;</strong>
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
