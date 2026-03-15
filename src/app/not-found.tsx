'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { buttonVariants } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-[5%]">
      <div className="max-w-[1200px] mx-auto text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <span className="text-xs font-medium uppercase tracking-[0.5em] text-muted-foreground mb-8 inline-block">
            Página no encontrada
          </span>

          <h1 className="text-[120px] md:text-[180px] font-extralight text-muted-foreground/30 leading-none mb-4 tracking-tight">
            404
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto leading-relaxed font-light mb-12">
            El camino que buscas no existe en este plano. Permítenos guiarte de regreso.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/" className={buttonVariants({ variant: "default", size: "lg", className: "px-8 rounded-full font-light tracking-widest uppercase" })}>
              Volver al Inicio
            </Link>
            <Link href="/contacto" className={buttonVariants({ variant: "secondary", size: "lg", className: "px-8 rounded-full font-light tracking-widest uppercase" })}>
              Contacto
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
