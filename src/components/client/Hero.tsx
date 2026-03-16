'use client';

import { Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

/**
 * Main Hero Fold
 */
export function Hero() {
  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 md:px-10">
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center gap-5 md:gap-8">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="inline-block text-[rgba(15,15,20,0.5)] font-medium text-xs uppercase tracking-[0.2em]">
            Tarot y Lectura de Cartas
          </span>

          <h1 className="text-3xl sm:text-6xl md:text-7xl text-[rgba(15,15,20,0.85)] font-light tracking-tight leading-[1.1]">
            <span className="block">portadora</span>
            <span className="block text-[rgba(15,15,20,0.45)]">de eros</span>
          </h1>
        </motion.div>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-sm md:text-lg text-[rgba(15,15,20,0.6)] max-w-md mx-auto leading-relaxed font-light px-2"
        >
          Sesiones de tarot y lectura de cartas para guiarte en tu camino espiritual.
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-4 md:mt-6 w-full px-4"
        >
          <Link 
            href="/servicios" 
            className="w-full sm:w-auto inline-flex items-center justify-center bg-[rgba(15,15,20,0.78)] text-white px-6 py-4 md:py-4 rounded-full text-xs font-medium tracking-[0.15em] uppercase hover:bg-[rgba(15,15,20,0.92)] transition-all min-h-[48px]"
          >
            <Calendar className="w-4 h-4 mr-2 shrink-0" />
            Agendar Consulta
          </Link>
          <Link 
            href="/servicios" 
            className="w-full sm:w-auto inline-flex items-center justify-center bg-transparent text-[rgba(15,15,20,0.6)] px-6 py-4 md:py-4 rounded-full text-xs font-medium tracking-[0.15em] uppercase hover:text-[rgba(15,15,20,0.85)] hover:bg-white/30 transition-all min-h-[48px]"
          >
            Ver Servicios
            <ArrowRight className="w-4 h-4 ml-2 shrink-0" />
          </Link>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-0"
      >
        <span className="text-[10px] uppercase tracking-widest text-[rgba(15,15,20,0.4)]">Scroll</span>
        <div className="w-px h-6 bg-[rgba(15,15,20,0.2)]" />
      </motion.div>
    </section>
  );
}

/**
 * About Preview Section
 */
export function AboutPreview() {
  return (
    <section className="py-16 md:py-28 px-4 md:px-10">
      <div className="max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs uppercase tracking-[0.3em] text-[rgba(15,15,20,0.5)] font-medium block mb-3">
            Sobre Mí
          </span>
          <h2 className="text-2xl sm:text-4xl font-light tracking-tight mb-5 md:mb-6 text-[rgba(15,15,20,0.85)]">
            Guía espiritual & canalizadora
          </h2>
          <p className="text-sm md:text-lg text-[rgba(15,15,20,0.6)] leading-relaxed font-light max-w-2xl mx-auto mb-6 md:mb-8 px-2">
            Trabajo con herramientas ancestrales para guiarte hacia la claridad y el bienestar interior.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center px-4">
            <Link 
              href="/sobre-mi" 
              className="w-full sm:w-auto px-6 md:px-7 py-3.5 rounded-full border border-black text-black text-xs uppercase tracking-widest hover:bg-[rgba(15,15,20,0.78)] hover:text-white transition-all flex items-center justify-center min-h-[48px]"
            >
              Conocer más
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link 
              href="/servicios" 
              className="w-full sm:w-auto px-6 md:px-7 py-3.5 rounded-full bg-[rgba(15,15,20,0.78)] text-white text-xs uppercase tracking-widest hover:bg-[rgba(15,15,20,0.92)] transition-all flex items-center justify-center min-h-[48px]"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Agendar Consulta
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Contact CTA Section
 */
export function ContactCTA() {
  return (
    <section className="py-16 md:py-28 px-4 md:px-10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl glass text-center p-6 md:p-12"
        >
          <h2 className="text-2xl sm:text-4xl font-light tracking-tight mb-4 text-[rgba(15,15,20,0.9)]">
            ¿Lista para comenzar?
          </h2>
          <p className="text-sm md:text-base text-[rgba(15,15,20,0.6)] font-light max-w-lg mx-auto mb-6 md:mb-8">
            Cada camino espiritual es único. Dejá que te guíe para encontrar las respuestas que buscás.
          </p>
          <Link
            href="/servicios"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-[rgba(15,15,20,0.78)] text-white px-6 md:px-7 py-3.5 md:py-4 rounded-full text-xs font-medium tracking-[0.15em] uppercase hover:bg-[rgba(15,15,20,0.92)] transition-all min-h-[48px]"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Agendar Consulta
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
