'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ServiceIcon } from '@/components/ui/ServiceIcons';
import type { Service } from '@/types';

interface ServiceCardProps {
  readonly service: Service;
  readonly index?: number;
  /** When true the card uses larger typography (for the featured/hero spot) */
  readonly featured?: boolean;
  /** Additional CSS classes */
  readonly className?: string;
}

const numberLabel = (i: number) => String(i + 1).padStart(2, '0');

export function ServiceCard({ service, index = 0, featured = false, className = '' }: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`h-full ${className}`}
    >
      <Link
        href={`/servicios/${service.slug}`}
        className="group relative flex flex-col h-full rounded-xl border border-gray-200 bg-white text-black transition-all duration-300 hover:bg-black hover:text-white hover:border-black hover:shadow-lg hover:shadow-black/20 overflow-hidden"
      >
        {/* Number stamp */}
        <span className="absolute top-4 right-4 text-[11px] font-mono tracking-widest text-gray-400 group-hover:text-white/40 transition-colors duration-300 select-none">
          {numberLabel(index)}
        </span>

        <div className={`flex flex-col h-full p-7 ${featured ? 'md:p-10' : 'md:p-8'}`}>

          {/* Icon */}
          <div className="mb-6 md:mb-8">
            <ServiceIcon
              type={service.icon}
              size={featured ? 30 : 24}
              className="text-black group-hover:text-white/80 transition-colors duration-300"
            />
          </div>

          {/* Title */}
          <h3 className={`font-light tracking-tight leading-tight mb-3 transition-colors duration-300 group-hover:text-white ${
            featured ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'
          }`}>
            {service.title}
          </h3>

          {/* Description */}
          <p className={`text-gray-500 group-hover:text-white/60 leading-relaxed font-light transition-all duration-300 group-hover:translate-y-0.5 ${
            featured ? 'text-sm md:text-base' : 'text-sm line-clamp-3'
          }`}>
            {service.shortDescription}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100 group-hover:border-white/10 transition-colors duration-300">
            <span className="text-[11px] uppercase tracking-widest font-medium text-gray-400 group-hover:text-white/40 transition-colors duration-300">
              {service.duration}&nbsp;min
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  globalThis.location.href = `/servicios/${service.slug}#message`;
                }}
                className="text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-full border border-gray-300 text-black bg-white group-hover:bg-white group-hover:text-black group-hover:border-white transition-all duration-200 hover:opacity-90"
              >
                Agendar
              </button>
              <ArrowRight
                size={15}
                strokeWidth={1.5}
                className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-white"
              />
            </div>
          </div>

        </div>
      </Link>
    </motion.div>
  );
}
