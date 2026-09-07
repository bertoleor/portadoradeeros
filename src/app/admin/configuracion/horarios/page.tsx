'use client';

import { useState, useEffect } from 'react';
import { Save, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { TimePicker } from '@/components/ui/TimePicker';
import { getAdminSettings, updateAdminSettings } from '@/lib/api/settings';

export default function HorariosConfiguracion() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  const [schedule, setSchedule] = useState({
    monday: { active: true, start: '10:00', end: '19:00' },
    tuesday: { active: true, start: '10:00', end: '19:00' },
    wednesday: { active: true, start: '10:00', end: '19:00' },
    thursday: { active: true, start: '10:00', end: '19:00' },
    friday: { active: true, start: '10:00', end: '18:00' },
    saturday: { active: false, start: '10:00', end: '14:00' },
    sunday: { active: false, start: '10:00', end: '14:00' },
  });

  useEffect(() => {
    async function fetchSettings() {
      const settings = await getAdminSettings();
      if (settings?.businessHours) {
        // Map from DB 'closed' boolean to UI 'active' boolean
        const newSchedule = { ...schedule };
        for (const [day, data] of Object.entries(settings.businessHours)) {
          if (day in newSchedule && data && typeof data === 'object') {
            const typedData = data as { closed?: boolean; start?: string; end?: string };
            newSchedule[day as keyof typeof schedule] = {
              active: typedData.closed === false,
              start: typedData.start || '09:00',
              end: typedData.end || '18:00',
            };
          }
        }
        setSchedule(newSchedule);
      }
      setIsLoading(false);
    }
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Convert back to DB format (closed = !active)
    const businessHoursToSave: Record<string, { closed: boolean; start: string; end: string }> = {};
    for (const [day, data] of Object.entries(schedule)) {
      businessHoursToSave[day] = {
        closed: !data.active,
        start: data.start,
        end: data.end,
      };
    }

    try {
      const result = await updateAdminSettings({ businessHours: businessHoursToSave });
      setIsSaving(false);
      if (result.ok) {
        success('Horarios actualizados. El calendario de reservas usará ahora esta disponibilidad.');
      } else {
        error('Hubo un error al guardar los horarios. Intentalo de nuevo.');
      }
    } catch (err) {
      setIsSaving(false);
      error((err as Error)?.message || 'Hubo un error al guardar los horarios. Intentalo de nuevo.');
    }
  };

  const updateDay = (day: keyof typeof schedule, field: 'active' | 'start' | 'end', value: string | boolean) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const daysLabels: Record<string, string> = {
    monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
    thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSave}>
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-medium text-black">Horarios de Trabajo</h2>
            <p className="text-black/50 text-sm mt-1">
              Configurá cuándo estás disponible. El selector del sitio público solo mostrará espacios libres dentro de estas horas.
            </p>
          </div>
          <button 
            type="submit"
            disabled={isSaving || isLoading}
            className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-2.5"
          >
            {isSaving ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <><Save size={16} /> Guardar</>
            )}
          </button>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-black/20 border-t-black animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 p-4 bg-yellow-50 text-yellow-800 rounded-xl mb-4 border border-yellow-100">
              <AlertTriangle size={20} className="shrink-0" />
              <p className="text-sm font-medium">
                Atención: Los turnos que ya están creados o agendados en el calendario no se moverán aunque cambies tu disponibilidad general aquí.
              </p>
            </div>

            {Object.entries(schedule).map(([dayKey, data]) => {
              const day = dayKey as keyof typeof schedule;
              return (
                <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-black/5 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  
                  <div className="flex items-center gap-3 w-40 shrink-0">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        id={`active-${day}`}
                        checked={data.active}
                        aria-label={`Activar ${daysLabels[day]}`}
                        onChange={(e) => updateDay(day, 'active', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                    </div>
                    <label htmlFor={`active-${day}`} className={`font-medium cursor-pointer ${data.active ? 'text-black' : 'text-black/40'}`}>
                      {daysLabels[day]}
                    </label>
                  </div>

                  <div className={`flex items-center gap-3 flex-1 transition-opacity ${data.active ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <TimePicker 
                      value={data.start}
                      onChange={(value) => updateDay(day, 'start', value)}
                      className="flex-1 max-w-[140px]"
                    />
                    <span className="text-black/40 font-medium">a</span>
                    <TimePicker 
                      value={data.end}
                      onChange={(value) => updateDay(day, 'end', value)}
                      className="flex-1 max-w-[140px]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </form>
    </div>
  );
}
