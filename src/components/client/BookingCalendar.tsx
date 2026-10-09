'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface BookingCalendarProps {
  readonly selectedDate: string;
  readonly onDateSelect: (date: string) => void;
  readonly businessHours?: Record<string, { closed: boolean }>;
}

export function BookingCalendar({
  selectedDate,
  onDateSelect,
  businessHours,
}: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const totalDays = daysInMonth(year, month);
  const startOffset = firstDayOfMonth(year, month);

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isDayClosed = (dateStr: string) => {
    if (!businessHours) {return false;}
    // Parse dateStr manually to avoid timezone shifts (e.g., "2024-03-18" -> local noon)
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return businessHours[dayName]?.closed ?? false;
  };

  return (
    <div className="w-full bg-[rgba(15,15,20,0.03)] border border-[rgba(15,15,20,0.08)] rounded-2xl p-5 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-sm font-medium text-[rgba(15,15,20,0.85)]">
          {monthNames[month]} {year}
        </h4>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            title="Mes anterior"
            aria-label="Mes anterior"
            className="p-2 hover:bg-[rgba(15,15,20,0.06)] rounded-full transition-colors text-[rgba(15,15,20,0.65)] hover:text-[rgba(15,15,20,0.90)]"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            title="Mes siguiente"
            aria-label="Mes siguiente"
            className="p-2 hover:bg-[rgba(15,15,20,0.06)] rounded-full transition-colors text-[rgba(15,15,20,0.65)] hover:text-[rgba(15,15,20,0.90)]"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dayLabels.map((label) => (
          <div
            key={`label-${label}`}
            className="text-center py-2 text-[10px] font-bold text-[rgba(15,15,20,0.65)] uppercase tracking-widest"
          >
            {label}
          </div>
        ))}

        {Array.from({ length: 42 }).map((_, i) => {
          const dayNumber = i - startOffset + 1;
          const isCurrentMonth = dayNumber > 0 && dayNumber <= totalDays;

          if (!isCurrentMonth) {return <div key={`empty-${year}-${month}-${i}`} />;}

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
          const dateObj = new Date(year, month, dayNumber);
          const isPast = dateObj < today;
          const isSelected = selectedDate === dateStr;
          const closed = isDayClosed(dateStr);
          const disabled = isPast || closed;

          const dateKey = `day-${dateStr}`;

          return (
            <button
              key={dateKey}
              type="button"
              disabled={disabled}
              onClick={() => onDateSelect(dateStr)}
              className={`
                relative h-10 w-full flex items-center justify-center rounded-xl text-xs transition-all duration-200
                ${
                  isSelected
                    ? 'bg-[rgba(15,15,20,0.72)] text-white font-bold shadow-sm scale-105 z-10'
                    : ''
                }
                ${!isSelected && disabled ? 'text-[rgba(15,15,20,0.6)] cursor-not-allowed' : ''}
                ${!isSelected && !disabled ? 'text-[rgba(15,15,20,0.70)] hover:bg-[rgba(15,15,20,0.06)] hover:text-[rgba(15,15,20,0.90)]' : ''}
              `}
            >
              {dayNumber}
              {isSelected && (
                <motion.div
                  layoutId="activeDay"
                  className="absolute inset-0 border-2 border-[rgba(15,15,20,0.72)] rounded-xl pointer-events-none"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              {!disabled && !isSelected && (
                <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-[rgba(15,15,20,0.15)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
