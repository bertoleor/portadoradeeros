'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const SPLASH_MS = 6000;
const FADE_OUT_MS = 800;

export default function BienvenidaPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'enter' | 'idle' | 'exit'>('enter');

  useEffect(() => {
    // enter → idle después de la animación inicial
    const t1 = setTimeout(() => setPhase('idle'), 1200);

    // idle → exit antes de navegar
    const t2 = setTimeout(() => setPhase('exit'), SPLASH_MS - FADE_OUT_MS);

    // navegar al dashboard
    const t3 = setTimeout(() => router.replace('/admin'), SPLASH_MS);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [router]);

  return (
    <motion.div
      className="fixed inset-0 overflow-hidden flex flex-col items-center justify-center"
      animate={{ opacity: phase === 'exit' ? 0 : 1 }}
      transition={{ duration: FADE_OUT_MS / 1000, ease: 'easeInOut' }}
    >
      {/* Fondo que hereda el aurora mesh del layout */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />

      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-8">

        {/* Logo / nombre */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-[rgba(15,15,20,0.40)] font-medium">
            Panel de administración
          </span>
          <h1 className="text-5xl md:text-6xl font-light text-[rgba(15,15,20,0.85)] tracking-tight">
            Jacque
          </h1>
          <span className="text-xs uppercase tracking-[0.2em] text-[rgba(15,15,20,0.35)] font-light">
            Portadora de Eros
          </span>
        </motion.div>

        {/* Separador animado */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
          className="w-12 h-px bg-[rgba(15,15,20,0.15)] origin-center"
        />

        {/* Dots loader */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="flex items-center gap-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[rgba(15,15,20,0.25)]"
              animate={{
                opacity: [0.25, 0.75, 0.25],
                scale: [0.8, 1.1, 0.8],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>

      </div>
    </motion.div>
  );
}