'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ServiceIcon } from '@/components/ui/ServiceIcons';
import type { Service } from '@/types';

interface Props {
  readonly services: Service[];
}

function ServiceMobileCard({ service, index }: { readonly service: Service; readonly index: number }) {
  return (
    <Link
      href={`/servicios/${service.slug}`}
      draggable={false}
      className="group relative flex flex-col min-h-[260px] sm:min-h-[320px] rounded-2xl border border-black/10 bg-white text-black transition-all duration-300 hover:bg-white/60 hover:border-[rgba(15,15,20,0.15)] hover:shadow-sm overflow-hidden"
    >
      <span className="absolute top-5 right-5 text-[10px] font-mono tracking-widest text-black/15 group-hover:text-white/15 transition-colors duration-300 select-none">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="flex flex-col flex-1 p-7">
        <div className="mb-6">
          <ServiceIcon type={service.icon} size={26} className="transition-colors duration-300" />
        </div>
        <h3 className="text-2xl font-light tracking-tight leading-tight mb-3">{service.title}</h3>
        <p className="text-sm text-[rgba(15,15,20,0.55)] group-hover:text-[rgba(15,15,20,0.75)] leading-relaxed font-light flex-1 line-clamp-3">
          {service.shortDescription}
        </p>
        <div className="flex items-center justify-between gap-3 mt-6 pt-5 border-t border-black/8 group-hover:border-white/10">
          <span className="text-[10px] uppercase tracking-widest font-medium text-[rgba(15,15,20,0.35)] group-hover:text-[rgba(15,15,20,0.55)]">
            {service.duration}&nbsp;min
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-full border border-current">
            Ver más
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ServicesMobileCarousel({ services }: Props) {
  const [active, setActive] = useState(0);
  const startXRef = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const total = services.length;
  const goTo = (i: number) => setActive(Math.max(0, Math.min(total - 1, i)));

  const onTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = startXRef.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) {
      goTo(delta > 0 ? active + 1 : active - 1);
    }
  };

  return (
    <div className="px-6 overflow-hidden">
      <div
        ref={trackRef}
        className="relative"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <motion.div
          className="flex"
          animate={{ x: `calc(-${active * 100}% - ${active * 12}px)` }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{ gap: '12px' } as React.CSSProperties}
        >
          {services.map((s, i) => (
            <div key={s.id || `service-${i}`} className="w-full shrink-0">
              <ServiceMobileCard service={s} index={i} />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 mt-5">
        {services.map((s, i) => (
          <button
            key={s.id || `dot-${i}`}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Ir a servicio ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === active ? 'w-5 h-1.5 bg-black' : 'w-1.5 h-1.5 bg-black/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
