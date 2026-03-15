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
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-6 md:px-10">
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center gap-6 md:gap-8">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="inline-block text-gray-500 font-medium text-xs uppercase tracking-[0.2em]">
            Tarot y Lectura de Cartas
          </span>

          <h1 className="text-4xl sm:text-6xl md:text-7xl text-black font-light tracking-tight leading-[1.1]">
            <span className="block">portadora</span>
            <span className="block text-gray-400">de eros</span>
          </h1>
        </motion.div>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-base md:text-lg text-gray-600 max-w-md mx-auto leading-relaxed font-light"
        >
          Sesiones de tarot y lectura de cartas para guiarte en tu camino espiritual.
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-6 px-4"
        >
          <Link 
            href="/servicios" 
            className="w-full sm:w-auto inline-flex items-center justify-center bg-black text-white px-7 py-3.5 sm:py-4 rounded-full text-[11px] sm:text-xs font-medium tracking-[0.15em] uppercase hover:bg-gray-800 transition-all"
          >
            <Calendar className="w-4 h-4 mr-2 shrink-0" />
            Agendar Consulta
          </Link>
          <Link 
            href="/servicios" 
            className="w-full sm:w-auto inline-flex items-center justify-center bg-transparent text-gray-600 px-7 py-3.5 sm:py-4 rounded-full text-[11px] sm:text-xs font-medium tracking-[0.15em] uppercase hover:text-black hover:bg-gray-50 transition-all"
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
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-widest text-gray-400">Scroll</span>
        <div className="w-px h-6 bg-gray-300" />
      </motion.div>
    </section>
  );
}

/**
 * About Preview Section
 */
export function AboutPreview() {
  return (
    <section className="py-20 md:py-28 px-6 md:px-10 bg-white">
      <div className="max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs uppercase tracking-[0.3em] text-gray-500 font-medium block mb-3">
            Sobre Mí
          </span>
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight mb-6 text-black">
            Guía espiritual & canalizadora
          </h2>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed font-light max-w-2xl mx-auto mb-8">
            Trabajo con herramientas ancestrales para guiarte hacia la claridad y el bienestar interior.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/sobre-mi" 
              className="px-7 py-3.5 rounded-full border border-black text-black text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center justify-center"
            >
              Conocer más
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link 
              href="/servicios" 
              className="px-7 py-3.5 rounded-full bg-black text-white text-xs uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center"
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
    <section className="py-20 md:py-28 px-6 md:px-10 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl bg-gray-900 text-white text-center p-8 md:p-12"
        >
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight mb-4">
            ¿Lista para comenzar?
          </h2>
          <p className="text-base text-gray-400 font-light max-w-lg mx-auto mb-8">
            Cada camino espiritual es único. Dejá que te guíe para encontrar las respuestas que buscás.
          </p>
          <Link
            href="/servicios"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-white text-gray-900 px-7 py-3.5 sm:py-4 rounded-full text-[11px] sm:text-xs font-medium tracking-[0.15em] uppercase hover:bg-gray-100 transition-all"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Agendar Consulta
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
