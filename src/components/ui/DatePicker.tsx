'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label?: string;
  readonly id?: string;
  readonly min?: string;
  readonly className?: string;
}

export function DatePicker({
  value,
  onChange,
  label,
  id,
  min,
  className = ''
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = value ? new Date(value + 'T12:00:00') : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const containerRef = useRef<HTMLDivElement>(null);

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

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateString = selectedDate.toISOString().split('T')[0];
    onChange(dateString);
    setIsOpen(false);
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return d.toISOString().split('T')[0] === value;
  };

  const isToday = (day: number) => {
    const today = new Date();
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return d.toDateString() === today.toDateString();
  };

  const isDisabled = (day: number) => {
    if (!min) return false;
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return d.toISOString().split('T')[0] < min;
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayLabels = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

  const totalDays = daysInMonth(currentMonth);
  const offset = firstDayOfMonth(currentMonth);
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = i - offset + 1;
    return day > 0 && day <= totalDays ? day : null;
  });

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
          <CalendarIcon size={16} className="text-black/30" />
          {value ? new Date(value + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Seleccionar fecha...'}
        </span>
        <ChevronRight 
          size={16} 
          className={`text-black/30 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -4 }}
            transition={{ duration: 0.15 }}
            className="
              absolute z-[100] w-[280px] mt-2 p-3
              bg-white border border-black/10 rounded-2xl 
              shadow-xl shadow-black/5
            "
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-sm font-medium text-black">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <div>
                <fieldset className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                  <legend className="sr-only">Seleccionar icono</legend>
                  <button 
                    type="button" 
                    onClick={handlePrevMonth}
                    aria-label="Mes anterior"
                    title="Mes anterior"
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-black/40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    type="button" 
                    onClick={handleNextMonth}
                    aria-label="Mes siguiente"
                    title="Mes siguiente"
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-black/40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </fieldset>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {dayLabels.map(label => (
                <div key={label} className="text-[10px] font-bold text-black/20 text-center py-1 uppercase">
                  {label}
                </div>
              ))}
              {calendarDays.map((day, i) => {
                const dayId = day ? `day-${currentMonth.getFullYear()}-${currentMonth.getMonth()}-${day}` : `empty-${i}`;
                const disabled = !day || isDisabled(day);
                const selected = Boolean(day && isSelected(day));
                const today = Boolean(day && isToday(day));

                return (
                  <div key={dayId} className="aspect-square">
                    {day !== null && (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => handleDateSelect(day)}
                        className={`
                          w-full h-full flex items-center justify-center text-xs rounded-lg transition-all
                          ${selected ? 'bg-black text-white font-medium shadow-lg shadow-black/10' : ''}
                          ${!selected && today ? 'bg-black/5 text-black font-bold' : ''}
                          ${!selected && !today ? 'text-black/70 hover:bg-gray-50' : ''}
                          ${disabled ? 'opacity-20 cursor-not-allowed' : ''}
                        `}
                      >
                        {day}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
