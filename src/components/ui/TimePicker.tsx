'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface TimePickerProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label?: string;
  readonly id?: string;
  readonly className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

export function TimePicker({ value, onChange, label, id, className = '' }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);

  const selectedHour = value ? value.split(':')[0] : '10';
  const selectedMinute = value ? value.split(':')[1] : '00';

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Center selected elements on open
  useEffect(() => {
    if (isOpen) {
      const scrollCenter = (ref: React.RefObject<HTMLDivElement | null>, val: string) => {
        if (ref.current) {
          const btn = ref.current.querySelector<HTMLElement>(`[data-value="${val}"]`);
          if (btn) {
            ref.current.scrollTo({
              top: btn.offsetTop - ref.current.offsetHeight / 2 + btn.offsetHeight / 2,
              behavior: 'smooth',
            });
          }
        }
      };
      // Short delay to allow for animation
      const timer = setTimeout(() => {
        scrollCenter(hourScrollRef, selectedHour);
        scrollCenter(minuteScrollRef, selectedMinute);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedHour, selectedMinute]);

  const handleHourChange = (newHour: string) => {
    onChange(`${newHour}:${selectedMinute}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    onChange(`${selectedHour}:${newMinute}`);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-[10px] font-bold uppercase tracking-[0.2em] text-black/35 mb-2"
        >
          {label}
        </label>
      )}

      <button
        type="button"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full flex items-center justify-between px-4 py-3 
          bg-white border border-black/10 rounded-2xl
          text-left text-sm transition-all duration-200
          hover:border-black/20 hover:bg-gray-50/50
          focus:outline-none focus:border-black/30 focus:ring-0
          text-black
        "
      >
        <span className="flex items-center gap-2">
          <Clock size={16} className="text-black/30" />
          {value || '10:00'}
        </span>
        <ChevronDown
          size={16}
          className={`text-black/30 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="
              absolute z-[100] w-full mt-2
              bg-white border border-black/10 rounded-3xl 
              shadow-xl shadow-black/10 overflow-hidden
            "
          >
            <div className="flex divide-x divide-black/5 h-[180px]">
              {/* Hours */}
              <div ref={hourScrollRef} className="flex-1 overflow-y-auto hide-scrollbar py-2">
                <div className="sticky top-0 bg-white/90 backdrop-blur-sm text-[9px] font-bold uppercase tracking-[0.2em] text-black/30 text-center py-1.5 mb-1">
                  Hora
                </div>
                {HOURS.map((h) => (
                  <button
                    key={`h-${h}`}
                    data-value={h}
                    type="button"
                    onClick={() => handleHourChange(h)}
                    className={`
                      w-full py-2.5 text-sm transition-colors relative flex items-center justify-center
                      ${
                        selectedHour === h
                          ? 'text-black font-semibold bg-black/[0.03]'
                          : 'text-black/50 hover:bg-gray-50'
                      }
                    `}
                  >
                    {h}
                    {selectedHour === h && (
                      <Check size={12} className="absolute right-3 opacity-30" />
                    )}
                  </button>
                ))}
              </div>

              {/* Minutes */}
              <div ref={minuteScrollRef} className="flex-1 overflow-y-auto hide-scrollbar py-2">
                <div className="sticky top-0 bg-white/90 backdrop-blur-sm text-[9px] font-bold uppercase tracking-[0.2em] text-black/30 text-center py-1.5 mb-1">
                  Minuto
                </div>
                {MINUTES.map((m) => (
                  <button
                    key={`m-${m}`}
                    data-value={m}
                    type="button"
                    onClick={() => handleMinuteChange(m)}
                    className={`
                      w-full py-2.5 text-sm transition-colors relative flex items-center justify-center
                      ${
                        selectedMinute === m
                          ? 'text-black font-semibold bg-black/[0.03]'
                          : 'text-black/50 hover:bg-gray-50'
                      }
                    `}
                  >
                    {m}
                    {selectedMinute === m && (
                      <Check size={12} className="absolute right-3 opacity-30" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2 border-t border-black/5">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-2 text-xs font-medium text-black/50 hover:text-black hover:bg-gray-50 rounded-xl transition-colors"
              >
                Listo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
