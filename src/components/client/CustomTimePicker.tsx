'use client';

import { useEffect, useRef, useState } from 'react';

interface CustomTimePickerProps {
  readonly value: string; // HH:mm format
  readonly onChange: (time: string) => void;
  readonly className?: string;
  readonly businessHours?: Record<string, { closed: boolean; start: string; end: string }>;
  readonly selectedDate?: string; // YYYY-MM-DD
  readonly bookedSlots?: string[];
  readonly blockedTimes?: { start: string; end: string; isAllDay: boolean }[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

export function CustomTimePicker({
  value,
  onChange,
  className = '',
  businessHours,
  selectedDate,
  bookedSlots = [],
  blockedTimes = [],
}: CustomTimePickerProps) {
  const [selectedHour, setSelectedHour] = useState<string>(value ? value.split(':')[0] : '');
  const [selectedMinute, setSelectedMinute] = useState<string>(value ? value.split(':')[1] : '');

  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  // Determine current day of week and its hours
  const getDayHours = () => {
    if (!selectedDate || !businessHours) {return { closed: true, start: 9, end: 18 };} // Default safe window

    // Get day name (monday, tuesday, etc)
    const date = new Date(selectedDate + 'T12:00:00'); // Use noon to avoid timezone shifts
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[date.getDay()];

    const dayConfig = businessHours?.[dayName];
    if (!dayConfig || dayConfig.closed) {return { closed: true, start: 0, end: 0 };}

    return {
      closed: false,
      start: Number.parseInt(dayConfig.start?.split(':')[0] || '9', 10),
      end: Number.parseInt(dayConfig.end?.split(':')[0] || '18', 10),
    };
  };

  const dayStatus = getDayHours();

  // Filter available hours based on business settings
  const availableHours = HOURS.filter((h) => {
    const hourNum = Number.parseInt(h, 10);
    return hourNum >= dayStatus.start && hourNum <= dayStatus.end;
  });

  // Sync internal state if `value` prop changes externally
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      if (h !== selectedHour) {setSelectedHour(h);}
      if (m !== selectedMinute) {setSelectedMinute(m);}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleHourSelect = (h: string) => {
    setSelectedHour(h);
    if (selectedMinute) {
      onChange(`${h}:${selectedMinute}`);
    } else {
      // If minute is not selected yet, default to '00'
      setSelectedMinute('00');
      onChange(`${h}:00`);
    }
  };

  const handleMinuteSelect = (m: string) => {
    setSelectedMinute(m);
    if (selectedHour) {
      onChange(`${selectedHour}:${m}`);
    } else {
      // If hour is not selected yet, default to '12'
      setSelectedHour('12');
      onChange(`12:${m}`);
    }
  };

  return (
    <div
      className={`relative flex border border-[rgba(15,15,20,0.1)] rounded-xl overflow-hidden bg-white/[0.03] h-[200px] ${className}`}
    >
      {dayStatus.closed ? (
        <div className="absolute inset-0 bg-gray-50/95 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-4 text-center">
          <p className="text-[rgba(15,15,20,0.6)] text-sm font-light">
            Este día no hay turnos disponibles
          </p>
          <p className="text-[rgba(15,15,20,0.65)] text-[11px] mt-1 italic">
            (Jacqueline no atiende los días seleccionados)
          </p>
        </div>
      ) : null}

      {/* Hours Column */}
      <div
        ref={hourRef}
        className="flex-1 overflow-y-auto hide-scrollbar border-r border-[rgba(15,15,20,0.1)]"
      >
        <div className="text-xs text-center text-[rgba(15,15,20,0.65)] py-2 border-b border-[rgba(15,15,20,0.05)] sticky top-0 bg-white/90 backdrop-blur-sm z-10">
          Hora
        </div>
        <div className="p-1">
          {availableHours.length > 0 ? (
            availableHours.map((h) => (
              <button
                key={`hour-${h}`}
                type="button"
                onClick={() => handleHourSelect(h)}
                className={`w-full py-2 text-sm text-center rounded-lg transition-colors ${
                  selectedHour === h
                    ? 'bg-[rgba(15,15,20,0.78)] text-white font-medium'
                    : 'text-[rgba(15,15,20,0.70)] hover:bg-[rgba(15,15,20,0.06)]'
                }`}
              >
                {h}
              </button>
            ))
          ) : (
            <div className="py-8 text-[11px] text-[rgba(15,15,20,0.65)] text-center px-2 font-light italic">
              No hay franjas configuradas
            </div>
          )}
        </div>
      </div>

      {/* Minutes Column */}
      <div ref={minuteRef} className="flex-1 overflow-y-auto hide-scrollbar">
        <div className="text-xs text-center text-[rgba(15,15,20,0.65)] py-2 border-b border-[rgba(15,15,20,0.05)] sticky top-0 bg-white/90 backdrop-blur-sm z-10">
          Minuto
        </div>
        <div className="p-1 min-h-[170px]">
          {MINUTES.map((m) => {
            const timeToCheck = `${selectedHour}:${m}`;
            const isBooked = bookedSlots.includes(timeToCheck);

            // Check if time is within blocked range
            const isBlocked = blockedTimes.some((bt) => {
              if (bt.isAllDay) {return true;}
              const [startH, startM] = bt.start.split(':').map(Number);
              const [endH, endM] = bt.end.split(':').map(Number);
              const timeH = Number.parseInt(selectedHour, 10);
              const timeM = Number.parseInt(m, 10);
              const timeMinutes = timeH * 60 + timeM;
              const startMinutes = startH * 60 + startM;
              const endMinutes = endH * 60 + endM;
              return timeMinutes >= startMinutes && timeMinutes < endMinutes;
            });

            const isDisabled = dayStatus.closed || isBooked || isBlocked;

            return (
              <button
                key={`minute-${m}`}
                type="button"
                disabled={isDisabled}
                onClick={() => handleMinuteSelect(m)}
                className={`w-full py-2 text-sm text-center rounded-lg transition-colors mb-1 ${
                  selectedMinute === m
                    ? 'bg-[rgba(15,15,20,0.78)] text-white font-medium'
                    : 'text-[rgba(15,15,20,0.70)] hover:bg-[rgba(15,15,20,0.06)]'
                } ${isDisabled ? 'opacity-20 cursor-not-allowed' : ''}`}
              >
                {m}
                {isBooked && !dayStatus.closed && (
                  <span className="block text-[8px] opacity-60">Reservado</span>
                )}
                {isBlocked && !dayStatus.closed && !isBooked && (
                  <span className="block text-[8px] opacity-60">Bloqueado</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
