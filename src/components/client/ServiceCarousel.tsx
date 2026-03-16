'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ServiceIcon } from '@/components/ui/ServiceIcons';
import { cn } from '@/lib/utils';
import type { Service } from '@/types';

const AUTO_MS = 5000;

/**
 * A portrait card — narrow and tall, elegant portrait ratio.
 */
function ServiceCard({ 
  service, 
  index, 
  isActive, 
  onNavigate,
  onClick
}: { 
  readonly service: Service; 
  readonly index: number;
  readonly isActive: boolean;
  readonly onNavigate: () => void;
  readonly onClick?: () => void;
}) {
  const handleClick = () => {
    if (isActive) {
      onNavigate();
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <button
      type="button"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleClick(); } }}
      onClick={handleClick}
      className={cn(
        "group relative flex flex-col md:flex-row h-[500px] md:h-[420px] rounded-[32px] border border-[rgba(255,255,255,0.3)] glass transition-all duration-500 overflow-hidden outline-none",
        isActive 
          ? "bg-white/45 shadow-[0_20px_50px_rgba(0,0,0,0.08)] cursor-pointer" 
          : "bg-white/20 cursor-pointer backdrop-blur-sm opacity-70 hover:opacity-85"
      )}
    >
      <span className="absolute top-8 right-8 text-[11px] font-mono tracking-[0.3em] text-[rgba(15,15,20,0.15)] select-none">
        {String(index + 1).padStart(2, '0')}
      </span>
      
      {/* Informative side (Left on PC) */}
      <div className="flex flex-col w-full md:w-[45%] p-8 md:p-12 md:border-r border-[rgba(15,15,20,0.08)] transition-colors duration-500 group-hover:bg-white/30">
        <div className="mb-auto">
          <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[rgba(15,15,20,0.05)] group-hover:bg-[rgba(15,15,20,0.1)] transition-colors duration-500">
            <ServiceIcon type={service.icon} size={24} className="text-[rgba(15,15,20,0.8)] transition-colors duration-500" />
          </div>
        </div>
        
        <h3 className="text-3xl md:text-4xl font-light tracking-tight leading-[1.2] text-[rgba(15,15,20,0.85)] transition-colors duration-500">
          {service.title}
        </h3>
      </div>

      {/* Action side (Right on PC) */}
      <div className="flex flex-col flex-1 p-8 md:p-12 justify-between bg-white/30 group-hover:bg-white/45 transition-colors duration-500">
        <p className={cn(
          "text-base leading-relaxed font-light transition-colors duration-500 flex-1 line-clamp-3 md:line-clamp-4",
          isActive ? "text-[rgba(15,15,20,0.6)]" : "text-[rgba(15,15,20,0.5)]"
        )}>
          {service.shortDescription}
        </p>
        
        <div className="flex items-center justify-between gap-4 mt-6 pt-6 border-t border-[rgba(15,15,20,0.08)]">
          <div className="flex flex-col gap-1 text-left">
            <span className={cn(
              "text-[10px] uppercase tracking-[0.2em] font-medium transition-colors duration-500",
              isActive ? "text-[rgba(15,15,20,0.4)]" : "text-[rgba(15,15,20,0.3)]"
            )}>
              Duración
            </span>
            <span className="text-sm font-light text-[rgba(15,15,20,0.8)]">
              {service.duration}&nbsp;min
            </span>
          </div>
          
          <div className="group/btn flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] px-6 py-3 rounded-full border border-[rgba(15,15,20,0.1)] bg-[rgba(15,15,20,0.8)] text-white hover:bg-[rgba(15,15,20,0.9)] transition-all duration-300">
            Explorar
            <ArrowRight size={14} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
          </div>
        </div>
      </div>
    </button>
  );
}

/**
 * Infinite loop helper
 */
function buildLoop(items: Service[]): Service[] {
  if (items.length === 0) return [];
  // Triple the array to handle infinite scroll seamlessly
  return [...items, ...items, ...items];
}

interface ServiceCarouselProps {
  readonly initialServices: Service[];
}

export function ServiceCarousel({ initialServices }: ServiceCarouselProps) {
  const router = useRouter();
  const [services] = useState<Service[]>(initialServices);
  // Start at the first item of the second (middle) copy
  const [index, setIndex] = useState(initialServices.length);
  const isPausedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isTransitioning = useRef(false);

  const total = services.length;
  const looped = buildLoop(services);

  // Layout constants according to user request: 60% main, 20% peek on each side
  const CARD_W_DESKTOP = 60; // %
  const CARD_GAP = 24; // px

  // Consolidate jump logic into a stable function
  const jumpToIndex = useCallback((targetIdx: number) => {
    if (!trackRef.current) return;
    trackRef.current.style.transition = 'none';
    setIndex(targetIdx);
    // Trigger reflow to apply transition:none immediately
    trackRef.current.getBoundingClientRect();
    requestAnimationFrame(() => {
      if (trackRef.current) {
        trackRef.current.style.transition = '';
      }
    });
  }, []);

  const goTo = useCallback((nextIdx: number, skipTimer = false) => {
    if (!trackRef.current || total === 0 || isTransitioning.current) return;

    isTransitioning.current = true;
    setIndex(nextIdx);

    // Teleport after finish animation
    setTimeout(() => {
      const normalized = ((nextIdx % total) + total) % total;
      const equivalentIndex = normalized + total;
      if (nextIdx !== equivalentIndex) {
        jumpToIndex(equivalentIndex);
      }
      isTransitioning.current = false;
    }, 510); // Slightly more than transition duration

    if (skipTimer) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!isPausedRef.current && !isTransitioning.current) {
        setIndex(prev => prev + 1);
      }
    }, AUTO_MS);
  }, [total, jumpToIndex]);

  const prev = useCallback(() => goTo(index - 1), [goTo, index]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);

  useEffect(() => {
    if (total === 0) return;
    const tick = () => {
      if (!isPausedRef.current && !isTransitioning.current) {
        setIndex(prev => prev + 1);
      }
    };
    timerRef.current = setInterval(tick, AUTO_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [total]);

  // Handle boundary teleport correctly after a tick or swipe
  useEffect(() => {
    if (isTransitioning.current || total === 0) return;
    
    // Check if we are outside the middle copy bounds
    if (index < total || index >= total * 2) {
      const normalized = ((index % total) + total) % total;
      // We use requestAnimationFrame to move the setState out of the synchronous render phase
      // This solves the React cascading render warning
      requestAnimationFrame(() => {
        jumpToIndex(normalized + total);
      });
    }
  }, [index, total, jumpToIndex]);

  // Swipe handling
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isPausedRef.current = true;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx > 0) next(); else prev();
    }
    isPausedRef.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = Math.abs(touchStartX.current - e.touches[0].clientX);
    const dy = Math.abs(touchStartY.current - e.touches[0].clientY);
    if (dx > dy) {
      if (e.cancelable) e.preventDefault();
    }
  };

  if (total === 0) return null;

  // Offset calculation for 60/20 proportions
  // Centering logic: -(index * itemWidth) + paddingToCenter
  // itemWidth = CARD_W_DESKTOP% + CARD_GAP
  // paddingToCenter = 50% - CARD_W_DESKTOP/2 = 20%
  const containerOffset = `calc(-${index} * (${CARD_W_DESKTOP}% + ${CARD_GAP}px) + (50% - ${CARD_W_DESKTOP / 2}%))`;
  const currentActual = ((index % total) + total) % total;

  return (
    <section
      aria-label="Carrusel de servicios"
      className="py-24 md:py-32"
      onMouseEnter={() => { isPausedRef.current = true; }}
      onMouseLeave={() => { isPausedRef.current = false; }}
    >
      {/* Header - Constrained to 1200px as per Audit 2026 */}
      <div className="px-6 md:px-10 mb-16 flex items-end justify-between gap-8 max-w-[1248px] mx-auto">
        <div className="max-w-xl">
          <span className="text-[11px] uppercase tracking-[0.4em] text-[rgba(15,15,20,0.35)] font-semibold block mb-4">
            Servicios Exclusivos
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-[rgba(15,15,20,0.85)] leading-tight">
            Guía y Claridad <br/><span className="text-[rgba(15,15,20,0.4)]">en tu camino.</span>
          </h2>
        </div>
        
        <div className="hidden md:flex items-center gap-3 shrink-0 mb-2">
          <button 
            type="button" 
            onClick={prev} 
            aria-label="Anterior"
            className="w-12 h-12 rounded-full border border-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-all duration-300"
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
          <button 
            type="button" 
            onClick={next} 
            aria-label="Siguiente"
            className="w-12 h-12 rounded-full border border-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-all duration-300"
          >
            <ArrowRight size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Main Track */}
      <div
        className="overflow-hidden relative"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchMove={onTouchMove}
      >
        <motion.div
          ref={trackRef}
          className="flex gap-[24px] transition-transform duration-500 ease-out"
          animate={{ x: containerOffset }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        >
          {looped.map((s, i) => (
            <div
              key={`${i}-${s.id}`}
              className={cn(
                "shrink-0 transition-all duration-700 ease-out",
                // Mobile is full width minus peeks, Desktop is 60%
                "w-[85%] md:w-[60%]"
              )}
            >
              <ServiceCard 
                service={s} 
                index={i % total} 
                isActive={i === index}
                onClick={() => goTo(i)}
                onNavigate={() => router.push(`/servicios/${s.slug}`)}
              />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Pagination & More */}
      <div className="flex flex-col items-center gap-10 mt-16">
        <div className="flex items-center justify-center gap-3">
          {services.map((s, i) => (
            <button
              key={`dot-${s.id}`}
              type="button"
              onClick={() => goTo(i + total)}
              aria-label={`Ir a servicio ${i + 1}`}
              className={cn(
                "h-1 transition-all duration-500 rounded-full",
                currentActual === i ? "w-8 bg-black" : "w-1.5 bg-black/10 hover:bg-black/20"
              )}
            />
          ))}
        </div>
        
        <Link 
          href="/servicios" 
          className="group flex items-center gap-3 text-xs uppercase tracking-[0.3em] font-medium text-[rgba(15,15,20,0.5)] hover:text-[rgba(15,15,20,0.85)] transition-all duration-300"
        >
          Ver todos los servicios
          <div className="w-8 h-[1px] bg-[rgba(15,15,20,0.15)] group-hover:w-12 group-hover:bg-[rgba(15,15,20,0.8)] transition-all duration-300" />
        </Link>
      </div>
    </section>
  );
}
