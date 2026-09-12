'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useActionState, useState, useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

import { login } from './actions';

/** 4-pointed star with sharp (angular) points */
function StarIcon({ size = 32 }: { readonly size?: number }) {
  // Outer radius (tip of point), inner radius (between points)
  const R = 50; const r = 18;
  // Points at N, E, S, W; inner points at 45° diagonals
  const pts = [
    [50, 50 - R],       // top
    [50 + r, 50 - r],   // top-right inner
    [50 + R, 50],       // right
    [50 + r, 50 + r],   // bottom-right inner
    [50, 50 + R],       // bottom
    [50 - r, 50 + r],   // bottom-left inner
    [50 - R, 50],       // left
    [50 - r, 50 - r],   // top-left inner
  ].map(([x, y]) => `${x},${y}`).join(' ');

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
      <polygon points={pts} />
    </svg>
  );
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export default function AdminLogin() {
  const [state, formAction, isPending] = useActionState<{ error: string | null }, FormData>(
    async (_prevState, formData) => await login(formData),
    { error: null }
  );
  const [showPassword, setShowPassword] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (globalThis.window === undefined) return;
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    globalThis.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    return () => globalThis.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    void deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8">
      <AnimatePresence mode="wait">
        {isPending ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-black/10 border-t-black/50 rounded-full mx-auto mb-4"
            />
            <p className="text-xs text-black/40 uppercase tracking-widest">Ingresando...</p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-sm"
          >
        {/* Star mark */}
        <div className="mb-14 text-center">
          <div className="inline-flex items-center justify-center mb-8 text-black">
            <StarIcon size={36} />
          </div>
          <h1 className="text-2xl font-light tracking-tight text-black mb-1">Jacque</h1>
          <p className="text-xs text-black/35 tracking-wide">Ingresá para acceder al panel</p>
        </div>

        {/* Form — no card, fields on white */}
        <form className="space-y-5" action={formAction}>
          <div>
            <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-black/35 mb-2">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="usuario@gmail.com"
              className="bg-white/60 border-[rgba(15,15,20,0.15)] focus:border-[rgba(15,15,20,0.4)] placeholder:text-black/20 rounded-xl py-5 text-sm backdrop-blur-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-black/35 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="bg-white/60 border-[rgba(15,15,20,0.15)] focus:border-[rgba(15,15,20,0.4)] placeholder:text-black/20 rounded-xl py-5 text-sm pr-10 backdrop-blur-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/25 hover:text-black/60 transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded border-black/20 accent-black cursor-pointer"
            />
            <label htmlFor="remember" className="text-xs text-black/45 cursor-pointer select-none">
              Recordar sesión 
            </label>
          </div>

          {/* Error */}
          {state?.error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] text-red-600 font-medium text-center"
            >
              {state.error}
            </motion.p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="btn-primary w-full mt-2"
          >
            {isPending ? 'Ingresando…' : 'Ingresar'}
          </Button>

          {/* PWA Install Button (Slightly more subtle) */}
          {deferredPrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pt-8 text-center"
            >
              <button
                type="button"
                onClick={handleInstallClick}
                className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full border border-black/5 text-[10px] font-bold uppercase tracking-widest text-black/30 hover:text-black hover:border-black/10 transition-all active:scale-95"
              >
                <StarIcon size={12} /> Descargar Aplicación
              </button>
            </motion.div>
          )}
        </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
