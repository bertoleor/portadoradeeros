'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { ServiceIcon } from '@/components/ui/ServiceIcons';
import { cn } from '@/lib/utils';

import type { Service } from '@/types';

// ─── Constantes ──────────────────────────────────────────────────────────────

const AUTO_MS = 5000; // ms entre avances automáticos
const DURATION_MS = 500; // ms de la transición CSS
const GAP_PX = 24; // gap entre cards en px
const CARD_PERCENT = 0.6; // ancho de la card activa como fracción del viewport

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface ServiceCardProps {
  readonly service: Service;
  readonly displayIndex: number;
  readonly isActive: boolean;
  readonly onNavigate: () => void;
  readonly onClick: () => void;
}

// ─── ServiceCard ─────────────────────────────────────────────────────────────

function ServiceCard({ service, displayIndex, isActive, onNavigate, onClick }: ServiceCardProps) {
  const handleClick = () => {
    if (isActive) {
      onNavigate();
    } else {
      onClick();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      className={cn(
        'group relative flex flex-col md:flex-row h-auto min-h-[340px] md:min-h-[380px] md:h-[380px]',
        'rounded-[32px] border border-[rgba(255,255,255,0.3)]',
        'glass transition-all duration-500 overflow-hidden w-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(15,15,20,0.55)] focus-visible:ring-offset-2',
        isActive
          ? 'bg-white/45 shadow-[0_20px_50px_rgba(0,0,0,0.08)] cursor-pointer'
          : 'bg-white/20 cursor-pointer backdrop-blur-sm opacity-70 hover:opacity-85'
      )}
    >
      {/* Número */}
      <span
        aria-hidden="true"
        className="absolute top-8 right-8 text-[11px] font-mono tracking-[0.3em] text-[rgba(15,15,20,0.9)] select-none"
      >
        {String(displayIndex + 1).padStart(2, '0')}
      </span>

      {/* Lado izquierdo — ícono + título */}
      <div className="flex flex-col justify-between w-full md:w-[45%] p-6 md:p-12 md:border-r border-[rgba(15,15,20,0.08)] transition-colors duration-500 group-hover:bg-white/30">
        <div className="flex items-center gap-3 mb-3 md:mb-auto md:block">
          <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl bg-[rgba(15,15,20,0.05)] group-hover:bg-[rgba(15,15,20,0.1)] transition-colors duration-500">
            <ServiceIcon
              type={service.icon}
              size={22}
              className="text-[rgba(15,15,20,0.8)] transition-colors duration-500"
            />
          </div>
          <h3 className="text-2xl md:text-4xl font-light tracking-tight leading-[1.2] text-[rgba(15,15,20,0.85)] mt-4 md:mt-0">
            {service.title}
          </h3>
        </div>
      </div>

      {/* Lado derecho — descripción + CTA */}
      <div className="flex flex-col flex-1 p-6 md:p-12 justify-between bg-white/30 group-hover:bg-white/45 transition-colors duration-500">
        <p
          className={cn(
            'text-base leading-relaxed font-light transition-colors duration-500 flex-1 line-clamp-2 md:line-clamp-4',
            isActive ? 'text-[rgba(15,15,20,0.65)]' : 'text-[rgba(15,15,20,0.6)]'
          )}
        >
          {service.shortDescription}
        </p>

        <div className="flex items-center justify-between gap-4 mt-6 pt-6 border-t border-[rgba(15,15,20,0.08)]">
          <div className="flex flex-col gap-1 text-left">
            <span
              className={cn(
                'text-[10px] uppercase tracking-[0.2em] font-medium transition-colors duration-500',
                isActive ? 'text-[rgba(15,15,20,0.65)]' : 'text-[rgba(15,15,20,0.6)]'
              )}
            >
              Duración
            </span>
            <span className="text-sm font-light text-[rgba(15,15,20,0.8)]">
              {service.duration}&nbsp;min
            </span>
          </div>

          <div className="btn-primary group/btn flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] px-6 py-3 rounded-full transition-all duration-300">
            Explorar
            <ArrowRight
              size={14}
              className="transition-transform duration-300 group-hover/btn:translate-x-1"
            />
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
// Se muestra mientras initialServices está vacío (SSR → hidratación)

function CarouselSkeleton() {
  return (
    <section className="py-24 md:py-32" aria-hidden="true">
      <div className="px-4 md:px-8 mb-16 max-w-[1200px] mx-auto">
        <div className="h-4 w-32 rounded-full bg-black/5 mb-4 animate-pulse" />
        <div className="h-12 w-80 rounded-2xl bg-black/5 animate-pulse" />
      </div>
      <div className="flex gap-6 px-6 md:px-10 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'shrink-0 w-[85%] md:w-[60%] h-[340px] md:h-[380px] rounded-[32px] bg-black/5 animate-pulse',
              i === 0 ? 'opacity-100' : 'opacity-40'
            )}
          />
        ))}
      </div>
    </section>
  );
}

// ─── ServiceCarousel ─────────────────────────────────────────────────────────

interface ServiceCarouselProps {
  readonly initialServices: Service[];
}

export function ServiceCarousel({ initialServices }: ServiceCarouselProps) {
  const router = useRouter();
  const total = initialServices.length;

  // ── Estado del índice
  // El array looped es [original × 3].
  // Empezamos en `total` (primera copia del medio) para poder ir hacia atrás.
  const [realIndex, setRealIndex] = useState(total); // posición en el array looped
  const [animated, setAnimated] = useState(false); // false = sin transition (teleport)

  // ── Refs
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardWidthRef = useRef(0); // ancho real de la card en px (calculado por ResizeObserver)
  const isPaused = useRef(false);
  const isJumping = useRef(false); // true durante el teleport silencioso
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Array triplicado para loop infinito
  const looped = [...initialServices, ...initialServices, ...initialServices];

  // ── Medir ancho de card con ResizeObserver (exacto, sin cálculos en %)
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return;
    }

    const measure = () => {
      const isMobile = typeof globalThis !== 'undefined' && globalThis.innerWidth < 768;
      cardWidthRef.current = wrapper.clientWidth * (isMobile ? 0.78 : CARD_PERCENT);
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(wrapper);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // ── Calcular translateX para un índice dado
  // Fórmula: desplazamos el track de forma que la card `idx` quede centrada.
  // Centro del viewport = wrapper.clientWidth / 2
  // Centro de la card   = idx * (cardWidth + GAP) + cardWidth / 2
  // translateX          = centro_viewport - centro_card
  const getOffset = useCallback((idx: number) => {
    const cw = cardWidthRef.current;
    const wrapper = wrapperRef.current;
    if (!wrapper || cw === 0) {
      return 0;
    }
    const viewCenter = wrapper.clientWidth / 2;
    const cardCenter = idx * (cw + GAP_PX) + cw / 2;
    return viewCenter - cardCenter;
  }, []);

  // ── Aplicar transform al track
  const applyTransform = useCallback(
    (idx: number, withTransition: boolean) => {
      const track = trackRef.current;
      if (!track) {
        return;
      }
      track.style.transition = withTransition
        ? `transform ${DURATION_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`
        : 'none';
      track.style.transform = `translateX(${getOffset(idx)}px)`;
    },
    [getOffset]
  );

  // ── Navegar a un índice (con animación)
  const goTo = useCallback((nextIdx: number) => {
    if (isJumping.current) {
      return;
    }
    setRealIndex(nextIdx);
    setAnimated(true);
  }, []);

  const prev = useCallback(() => goTo(realIndex - 1), [goTo, realIndex]);
  const next = useCallback(() => goTo(realIndex + 1), [goTo, realIndex]);

  // ── Sincronizar transform cuando cambia el índice o animated
  useLayoutEffect(() => {
    applyTransform(realIndex, animated);
  }, [realIndex, animated, applyTransform]);

  // ── Teleport silencioso al terminar la transición (onTransitionEnd)
  const handleTransitionEnd = useCallback(() => {
    if (!animated) {
      return;
    }
    const normalized = ((realIndex % total) + total) % total;
    const middle = normalized + total; // equivalente en la copia del medio
    if (realIndex !== middle) {
      isJumping.current = true;
      setAnimated(false);
      setRealIndex(middle);
      // Necesitamos un frame extra para que React aplique el nuevo índice
      // antes de volver a habilitar la transición
      requestAnimationFrame(() => {
        isJumping.current = false;
      });
    }
  }, [animated, realIndex, total]);

  // ── Autoplay
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      if (!isPaused.current && !isJumping.current) {
        goTo(realIndex + 1);
      }
    }, AUTO_MS);
  }, [goTo, realIndex]);

  // Reiniciamos el timer cada vez que `realIndex` cambia para que el closure
  // siempre tenga el valor actualizado de `realIndex`.
  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startTimer]);

  // ── Swipe táctil
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isPaused.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = Math.abs(touchStartX.current - e.touches[0].clientX);
    const dy = Math.abs(touchStartY.current - e.touches[0].clientY);
    if (dx > dy && e.cancelable) {
      e.preventDefault();
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx > 0) {
        next();
      } else {
        prev();
      }
    }
    isPaused.current = false;
  };

  // ── Guardia: sin datos → skeleton
  if (total === 0) {
    return <CarouselSkeleton />;
  }

  // ── Índice real normalizado (para dots y ServiceCard.displayIndex)
  const currentActual = ((realIndex % total) + total) % total;

  return (
    <section
      aria-label="Carrusel de servicios"
      className="py-12 md:py-32 bg-transparent"
      onMouseEnter={() => {
        isPaused.current = true;
      }}
      onMouseLeave={() => {
        isPaused.current = false;
      }}
    >
      {/* Header */}
      <div className="px-4 md:px-8 mb-8 md:mb-16 flex items-end justify-between gap-8 max-w-[1200px] mx-auto">
        <div className="max-w-xl">
          <span className="text-[11px] uppercase tracking-[0.4em] text-[rgba(15,15,20,0.65)] font-semibold block mb-3 md:mb-4">
            Servicios Exclusivos
          </span>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-light tracking-tight text-[rgba(15,15,20,0.85)] leading-tight">
            Guía y Claridad <br />
            <span className="text-[rgba(15,15,20,0.65)]">en tu camino.</span>
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

      {/* Mobile Navigation Arrows */}
      <div className="md:hidden flex items-center justify-between gap-2 px-4 mb-4">
        <button
          type="button"
          onClick={prev}
          aria-label="Anterior"
          className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center bg-white/50 backdrop-blur-sm hover:bg-black hover:text-white transition-all duration-300"
        >
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Siguiente"
          className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center bg-white/50 backdrop-blur-sm hover:bg-black hover:text-white transition-all duration-300"
        >
          <ArrowRight size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* Track */}
      <div
        ref={wrapperRef}
        className="overflow-hidden relative"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchMove={onTouchMove}
      >
        <div ref={trackRef} className="flex gap-6" onTransitionEnd={handleTransitionEnd}>
          {looped.map((s, i) => (
            <div key={`${s.id}-${i}`} className="shrink-0 w-[78%] md:w-[60%]">
              <ServiceCard
                service={s}
                displayIndex={i % total}
                isActive={i === realIndex}
                onClick={() => goTo(i)}
                onNavigate={() => router.push(`/servicios/${s.slug}`)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dots + link */}
      <div className="flex flex-col items-center gap-10 mt-16">
        <div className="flex items-center justify-center gap-3 py-[21px] -my-[21px] box-content">
          {initialServices.map((s, i) => (
            <button
              key={`dot-${s.id}`}
              type="button"
              onClick={() => goTo(i + total)}
              aria-label={`Ir a servicio ${i + 1}`}
              className={cn(
                'h-1 transition-all duration-500 rounded-full',
                currentActual === i ? 'w-8 bg-black' : 'w-1.5 bg-black/10 hover:bg-black/20'
              )}
            />
          ))}
        </div>

        <Link
          href="/servicios"
          className="group flex items-center gap-3 text-xs uppercase tracking-[0.3em] font-medium text-[rgba(15,15,20,0.65)] hover:text-[rgba(15,15,20,0.85)] transition-all duration-300"
        >
          Ver todos los servicios
          <div className="w-8 h-[1px] bg-[rgba(15,15,20,0.15)] group-hover:w-12 group-hover:bg-[rgba(15,15,20,0.8)] transition-all duration-300" />
        </Link>
      </div>
    </section>
  );
}
