'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

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
        className="group relative flex flex-col h-full rounded-xl glass border border-[rgba(255,255,255,0.3)] text-[rgba(15,15,20,0.85)] transition-all duration-300 hover:bg-white/40 hover:shadow-lg hover:shadow-black/10 overflow-hidden"
      >
        {/* Number stamp */}
        <span className="absolute top-4 right-4 text-[11px] font-mono tracking-widest text-[rgba(15,15,20,0.4)] group-hover:text-[rgba(15,15,20,0.6)] transition-colors duration-300 select-none">
          {numberLabel(index)}
        </span>

        <div className={`flex flex-col h-full p-7 ${featured ? 'md:p-10' : 'md:p-8'}`}>

          {/* Icon */}
          <div className="mb-6 md:mb-8">
            <ServiceIcon
              type={service.icon}
              size={featured ? 30 : 24}
              className="text-[rgba(15,15,20,0.85)] group-hover:text-[rgba(15,15,20,0.95)] transition-colors duration-300"
            />
          </div>

          {/* Title */}
          <h3 className={`font-light tracking-tight leading-tight mb-3 transition-colors duration-300 group-hover:text-[rgba(15,15,20,0.95)] ${
            featured ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'
          }`}>
            {service.title}
          </h3>

          {/* Description */}
          <p className={`text-[rgba(15,15,20,0.65)] group-hover:text-[rgba(15,15,20,0.8)] leading-relaxed font-light transition-all duration-300 group-hover:translate-y-0.5 ${
            featured ? 'text-sm md:text-base' : 'text-sm line-clamp-3'
          }`}>
            {service.shortDescription}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-[rgba(15,15,20,0.08)] group-hover:border-[rgba(15,15,20,0.15)] transition-colors duration-300">
            <span className="text-[11px] uppercase tracking-widest font-medium text-[rgba(15,15,20,0.5)] group-hover:text-[rgba(15,15,20,0.7)] transition-colors duration-300">
              {service.duration}&nbsp;min
            </span>

            <div className="flex items-center gap-3">
              <ArrowRight
                size={15}
                strokeWidth={1.5}
                className="text-[rgba(15,15,20,0.5)] group-hover:text-[rgba(15,15,20,0.85)] group-hover:translate-x-1 transition-all duration-300"
              />
            </div>
          </div>

        </div>
      </Link>
    </motion.div>
  );
}
