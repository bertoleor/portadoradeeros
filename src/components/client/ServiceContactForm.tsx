'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Copy, 
  Check, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  CreditCard,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Input, Label } from '@/components/ui';
import { Textarea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import Link from 'next/link';
import {
  createAppointment,
  getBookedSlots,
  getBlockedTimesForDate,
} from '@/lib/api/appointments';
import { BookingCalendar } from './BookingCalendar';
import { CustomTimePicker } from './CustomTimePicker';

interface ServiceContactFormProps {
  readonly serviceName: string;
  readonly serviceId: string;
  readonly serviceDuration?: number;
  readonly bankDetails: {
    readonly bankOwner: string;
    readonly bankName: string;
    readonly cbu: string;
    readonly alias: string;
  };
  readonly businessHours?: Record<string, { closed: boolean; start: string; end: string }>;
}

type Step = 0 | 1 | 2 | 3 | 4;

interface FormData {
  name: string;
  surname: string;
  email: string;
  phone: string;
  message: string;
  appointmentDate: string;
  appointmentTime: string;
}

interface StepProps {
  readonly formData: FormData;
  readonly handleChange: (field: keyof FormData, value: string) => void;
  readonly prevStep: () => void;
  readonly errors: Record<string, string>;
}

// --- Helpers ---
const parseLocalDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
};

// --- Step Components ---

const StepIntro = ({ nextStep, serviceName }: { nextStep: () => void; serviceName: string }) => (
  <div className="flex flex-col items-center justify-center text-center py-12 md:py-20 h-full">
    <div className="w-16 h-16 rounded-2xl bg-[rgba(15,15,20,0.06)] flex items-center justify-center mb-8 relative border border-[rgba(15,15,20,0.1)]">
      <Sparkles size={32} className="text-[rgba(15,15,20,0.7)]" />
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-[rgba(15,15,20,0.6)] rounded-full" />
    </div>
    <h3 className="text-2xl md:text-3xl font-light text-[rgba(15,15,20,0.9)] tracking-tight mb-4">Agendar {serviceName}</h3>
    <p className="text-[rgba(15,15,20,0.5)] text-sm md:text-base font-light max-w-sm mb-12 leading-relaxed">Inicia el proceso para reservar tu sesión personalizada en simples pasos.</p>
    <Button onClick={nextStep} className="group rounded-full px-12 py-4 md:py-7 h-auto bg-[rgba(15,15,20,0.85)] text-white hover:bg-[rgba(15,15,20,1)] text-sm font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95">Comenzar Reserva <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" /></Button>
  </div>
);

const StepClientInfo = ({ formData, handleChange, nextStep, prevStep, errors }: StepProps & { nextStep: () => void }) => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <div><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgba(15,15,20,0.35)] block mb-2">Paso 1 de 4</span><h3 className="text-2xl font-light text-[rgba(15,15,20,0.9)] tracking-tight">Tus Datos</h3></div>
      <div className="w-10 h-10 rounded-xl bg-[rgba(15,15,20,0.06)] flex items-center justify-center text-[rgba(15,15,20,0.4)]"><User size={20} /></div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {[
        { id: 'name', label: 'Nombre', placeholder: 'Tu nombre' },
        { id: 'surname', label: 'Apellido', placeholder: 'Tu apellido' },
        { id: 'email', label: 'Email', placeholder: 'ejemplo@correo.com', type: 'email' },
        { id: 'phone', label: 'WhatsApp', placeholder: '+54 9...' },
      ].map((f) => (
        <div key={f.id} className="space-y-2">
          <Label htmlFor={f.id} className="text-[10px] font-bold text-[rgba(15,15,20,0.5)] uppercase tracking-widest ml-1">{f.label}</Label>
          <Input id={f.id} type={f.type || 'text'} placeholder={f.placeholder} value={formData[f.id as keyof FormData]} onChange={(e) => handleChange(f.id as keyof FormData, e.target.value)} className="bg-white/50 border-[rgba(15,15,20,0.15)] text-[rgba(15,15,20,0.9)] placeholder:text-[rgba(15,15,20,0.35)] h-14 rounded-2xl" />
          {errors[f.id] && <p className="text-[10px] text-red-500 ml-1">{errors[f.id]}</p>}
        </div>
      ))}
    </div>
    <div className="space-y-2">
      <Label htmlFor="message" className="text-[10px] font-bold text-[rgba(15,15,20,0.4)] uppercase tracking-widest ml-1 flex items-center gap-1.5">
        <MessageSquare size={12} /> Notas (opcional)
      </Label>
      <Textarea
        id="message"
        placeholder="Contame brevemente tu consulta..."
        value={formData.message}
        onChange={(e) => handleChange('message', e.target.value)}
        className="bg-white/50 border border-[rgba(15,15,20,0.1)] text-[rgba(15,15,20,0.9)] placeholder:text-[rgba(15,15,20,0.35)] h-32 rounded-2xl resize-none"
      />
    </div>
    <div className="pt-8 flex justify-between items-center">
      <button onClick={prevStep} className="text-[rgba(15,15,20,0.4)] hover:text-[rgba(15,15,20,0.7)] text-xs font-medium translation-colors">Cancelar</button>
      <Button onClick={nextStep} className="rounded-full px-10 py-4 md:py-6 h-auto bg-white text-black hover:bg-white/90 font-bold uppercase tracking-widest text-[11px]">Continuar <ChevronRight size={16} className="ml-2" /></Button>
    </div>
  </div>
);

const StepDateSelection = ({ formData, handleChange, nextStep, prevStep, errors, businessHours }: StepProps & { nextStep: () => void; businessHours: Record<string, { closed: boolean; start: string; end: string }> | undefined }) => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <div><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgba(15,15,20,0.3)] block mb-2">Paso 2 de 4</span><h3 className="text-2xl font-light text-[rgba(15,15,20,0.9)] tracking-tight">Seleccionar Día</h3></div>
      <div className="w-10 h-10 rounded-xl bg-[rgba(15,15,20,0.06)] flex items-center justify-center text-[rgba(15,15,20,0.4)]"><CalendarIcon size={20} /></div>
    </div>
    <div className="max-w-md mx-auto w-full">
      <BookingCalendar selectedDate={formData.appointmentDate} onDateSelect={(d) => handleChange('appointmentDate', d)} businessHours={businessHours} />
      {errors.appointmentDate && <p className="text-center text-[10px] text-red-500 mt-4">{errors.appointmentDate}</p>}
    </div>
    <div className="pt-8 flex justify-between items-center">
      <button onClick={prevStep} className="flex items-center text-white/40 hover:text-white text-xs font-medium"><ChevronLeft size={16} className="mr-1" /> Atrás</button>
      <Button onClick={nextStep} disabled={!formData.appointmentDate} className="rounded-full px-10 py-6 h-auto bg-white text-black hover:bg-white/90 font-bold uppercase tracking-widest text-[11px] disabled:opacity-50">Elegir Hora <ChevronRight size={16} className="ml-2" /></Button>
    </div>
  </div>
);

const StepTimeSelection = ({ formData, handleChange, nextStep, prevStep, errors, businessHours, bookedSlots, blockedTimes }: StepProps & { nextStep: () => void; businessHours: Record<string, { closed: boolean; start: string; end: string }> | undefined; bookedSlots: string[]; blockedTimes: { start: string; end: string; isAllDay: boolean }[] }) => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <div><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgba(15,15,20,0.3)] block mb-2">Paso 3 de 4</span><h3 className="text-2xl font-light text-[rgba(15,15,20,0.9)] tracking-tight">Horarios Disponibles</h3></div>
      <div className="w-10 h-10 rounded-xl bg-[rgba(15,15,20,0.06)] flex items-center justify-center text-[rgba(15,15,20,0.4)]"><Clock size={20} /></div>
    </div>
    <div className="max-w-md mx-auto w-full">
      <div className="mb-4 text-center"><p className="text-sm text-[rgba(15,15,20,0.6)] font-light">Sesiones para el {parseLocalDate(formData.appointmentDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}</p></div>
      <CustomTimePicker value={formData.appointmentTime} onChange={(val) => handleChange('appointmentTime', val)} businessHours={businessHours} selectedDate={formData.appointmentDate} bookedSlots={bookedSlots} blockedTimes={blockedTimes} />
      {errors.appointmentTime && <p className="text-center text-[10px] text-red-500 mt-4">{errors.appointmentTime}</p>}
    </div>
    <div className="pt-8 flex justify-between items-center">
      <button onClick={prevStep} className="flex items-center text-[rgba(15,15,20,0.4)] hover:text-[rgba(15,15,20,0.7)] text-xs font-medium"><ChevronLeft size={16} className="mr-1" /> Atrás</button>
      <Button onClick={nextStep} disabled={!formData.appointmentTime} className="rounded-full px-10 py-6 h-auto bg-[rgba(15,15,20,0.85)] text-white hover:bg-[rgba(15,15,20,1)] font-bold uppercase tracking-widest text-[11px] disabled:opacity-50">Continuar <ChevronRight size={16} className="ml-2" /></Button>
    </div>
  </div>
);

const StepFinal = ({ formData, onSubmit, prevStep, errors, serviceName, bankDetails, handleCopy, copiedField, isLoading, acceptedLegal, setAcceptedLegal }: Omit<StepProps, 'handleChange'> & { onSubmit: () => void, serviceName: string, bankDetails: { bankOwner: string; bankName: string; cbu: string; alias: string }, handleCopy: (text: string, field: string) => void, copiedField: string | null, isLoading: boolean, acceptedLegal: boolean, setAcceptedLegal: (v: boolean) => void }) => (
  <div className="space-y-10">
    <div className="flex items-center justify-between">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgba(15,15,20,0.3)] block mb-2">Finalizar Reserva</span>
        <h3 className="text-2xl font-light text-[rgba(15,15,20,0.9)] tracking-tight">Confirmación y Pago</h3>
      </div>
      <div className="w-10 h-10 rounded-xl bg-[rgba(15,15,20,0.06)] flex items-center justify-center text-[rgba(15,15,20,0.4)]">
        <CreditCard size={20} />
      </div>
    </div>

    <div className="max-w-2xl mx-auto w-full space-y-8">
      {/* Resumen del Turno */}
      <div className="bg-[rgba(15,15,20,0.03)] border border-[rgba(15,15,20,0.1)] rounded-[2rem] p-8 text-center space-y-3 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[rgba(15,15,20,0.1)] to-transparent" />
        <p className="text-[10px] font-bold text-[rgba(15,15,20,0.2)] uppercase tracking-[0.3em]">Resumen de tu Sesión</p>
        <h4 className="text-xl text-[rgba(15,15,20,0.9)] font-light tracking-wide">{serviceName}</h4>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <div className="flex items-center gap-2 text-[rgba(15,15,20,0.6)] text-xs font-light">
            <CalendarIcon size={14} className="text-[rgba(15,15,20,0.3)]" />
            {parseLocalDate(formData.appointmentDate).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <div className="flex items-center gap-2 text-[rgba(15,15,20,0.6)] text-xs font-light">
            <Clock size={14} className="text-[rgba(15,15,20,0.3)]" />
            {formData.appointmentTime} hs
          </div>
        </div>
      </div>

      {/* Datos de Transferencia */}
      <div className="bg-[rgba(15,15,20,0.03)] border border-[rgba(15,15,20,0.1)] rounded-[2rem] p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[rgba(15,15,20,0.06)] flex items-center justify-center text-[rgba(15,15,20,0.3)]">
            <CreditCard size={16} />
          </div>
          <h4 className="text-sm font-medium text-[rgba(15,15,20,0.9)] tracking-tight">Datos para el pago</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-[rgba(15,15,20,0.04)] rounded-2xl p-4 border border-[rgba(15,15,20,0.05)]">
            <p className="text-[10px] text-[rgba(15,15,20,0.3)] uppercase tracking-widest mb-1">Titular</p>
            <p className="text-sm text-[rgba(15,15,20,0.9)] font-medium">{bankDetails.bankOwner || 'Jacqueline'}</p>
          </div>
          <div className="bg-[rgba(15,15,20,0.04)] rounded-2xl p-4 border border-[rgba(15,15,20,0.05)]">
            <p className="text-[10px] text-[rgba(15,15,20,0.3)] uppercase tracking-widest mb-1">Banco</p>
            <p className="text-sm text-[rgba(15,15,20,0.9)] font-medium">{bankDetails.bankName || 'Mercado Pago'}</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { id: 'cbu', label: 'CVU / CBU', value: bankDetails.cbu },
            { id: 'alias', label: 'Alias', value: bankDetails.alias }
          ].map(field => (
            <div key={field.id} className="relative group">
              <p className="text-[10px] text-[rgba(15,15,20,0.3)] uppercase tracking-widest mb-2 ml-1">{field.label}</p>
              <div className="flex items-center justify-between bg-[rgba(15,15,20,0.06)] rounded-2xl border border-[rgba(15,15,20,0.1)] px-5 py-4 transition-all group-hover:border-[rgba(15,15,20,0.2)]">
                <code className="text-xs text-[rgba(15,15,20,0.9)] font-mono tracking-wider">{field.value || '—'}</code>
                <button
                  type="button"
                  onClick={() => handleCopy(field.value, field.id)}
                  className="ml-4 p-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[rgba(15,15,20,0.1)] rounded-xl transition-all active:scale-90"
                >
                  {copiedField === field.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-[rgba(15,15,20,0.2)] group-hover:text-[rgba(15,15,20,0.4)]" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Area */}
      <div className="space-y-6 pt-4">
        {errors.submit && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs text-center animate-shake">
            {errors.submit}
          </div>
        )}
        <div className="px-4 py-4">
          <Checkbox
            id="legal-accept"
            checked={acceptedLegal}
            onChange={(e) => setAcceptedLegal(e.target.checked)}
            label={
              <span>
                He leído y acepto los <Link href="/terminos" target="_blank" className="text-[rgba(15,15,20,0.8)] underline decoration-[rgba(15,15,20,0.2)] hover:decoration-[rgba(15,15,20,0.4)] transition-all">Términos y Condiciones</Link> y la <Link href="/politica-cancelacion" target="_blank" className="text-[rgba(15,15,20,0.8)] underline decoration-[rgba(15,15,20,0.2)] hover:decoration-[rgba(15,15,20,0.4)] transition-all">Política de Cancelación</Link> (24hs).
              </span>
            }
          />
        </div>

        <div className="flex flex-col items-center">
          <Button
            onClick={onSubmit}
            disabled={isLoading || !acceptedLegal}
            className="w-full max-w-sm rounded-full py-8 h-auto bg-[rgba(15,15,20,0.85)] text-white hover:bg-[rgba(15,15,20,1)] font-bold uppercase tracking-[0.2em] text-[12px] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            ) : (
              <span className="flex items-center gap-3">
                Confirmar Turno <ChevronRight size={18} />
              </span>
            )}
          </Button>

          <p className="text-[10px] text-[rgba(15,15,20,0.3)] text-center mt-8 leading-relaxed font-light max-w-xs uppercase tracking-widest">
            Recibirás un email con los detalles. El turno será validado al recibir el comprobante.
          </p>
        </div>
      </div>
    </div>

    <div className="pt-6">
      <button
        onClick={prevStep}
        className="flex items-center gap-2 text-[rgba(15,15,20,0.3)] hover:text-[rgba(15,15,20,0.7)] text-xs font-medium transition-colors group"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Volver atrás
      </button>
    </div>
  </div>
);

// --- Main Component ---

export function ServiceContactForm({ serviceName, serviceId, serviceDuration = 60, bankDetails, businessHours }: ServiceContactFormProps) {
  const [step, setStep] = useState<Step>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({ name: '', surname: '', email: '', phone: '', message: '', appointmentDate: '', appointmentTime: '' });
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<{ start: string; end: string; isAllDay: boolean }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  useEffect(() => {
    if (formData.appointmentDate) {
      const fetchAvailability = async () => {
        const [slots, blocked] = await Promise.all([getBookedSlots(formData.appointmentDate, serviceDuration), getBlockedTimesForDate(formData.appointmentDate)]);
        setBookedSlots(slots);
        setBlockedTimes(blocked);
      };
      fetchAvailability();
    }
  }, [formData.appointmentDate, serviceDuration]);

  const handleChange = (f: keyof FormData, v: string) => {
    setFormData(prev => ({ ...prev, [f]: v }));
    if (errors[f]) setErrors(prev => ({ ...prev, [f]: '' }));
  };

  const validateStep = (s: Step) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!formData.name.trim()) e.name = 'Requerido';
      if (!formData.surname.trim()) e.surname = 'Requerido';
      if (!formData.phone.trim()) e.phone = 'Requerido';
      if (!formData.email.trim()) e.email = 'Requerido';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Email inválido';
    } else if (s === 2 && !formData.appointmentDate) e.appointmentDate = 'Seleccioná un día';
    else if (s === 3 && !formData.appointmentTime) e.appointmentTime = 'Seleccioná una hora';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();
    setIsLoading(true);
    try {
      const [y, m, d] = formData.appointmentDate.split('-').map(Number);
      const [hh, mm] = formData.appointmentTime.split(':').map(Number);
      const result = await createAppointment({
        serviceId, serviceName, clientName: `${formData.name} ${formData.surname}`,
        clientEmail: formData.email, clientPhone: formData.phone,
        appointmentDate: new Date(y, m - 1, d, hh, mm),
        notes: formData.message,
      });
      if (result.success) setIsSubmitted(true);
      else setErrors({ submit: result.error || 'Error al agendar.' });
    } catch { setErrors({ submit: 'Error de conexión.' }); }
    finally { setIsLoading(false); }
  };

  const handleCopy = (t: string, f: string) => {
    navigator.clipboard.writeText(t);
    setCopiedField(f);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isSubmitted) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2.5rem] glass-opaque p-8 md:p-12 text-center min-h-[400px] flex flex-col items-center justify-center shadow-2xl border border-[rgba(255,255,255,0.5)]">
        <div className="w-20 h-20 rounded-full bg-[rgba(15,15,20,0.06)] flex items-center justify-center mb-8"><CheckCircle2 size={40} className="text-[rgba(15,15,20,0.7)]" /></div>
        <h3 className="text-3xl font-light text-[rgba(15,15,20,0.9)] mb-4 tracking-tight">Turno Solicitado</h3>
        <p className="text-[rgba(15,15,20,0.6)] text-base max-w-sm mx-auto mb-10 font-light leading-relaxed">Tu pedido para <span className="text-[rgba(15,15,20,0.9)] font-medium">{serviceName}</span> ha sido enviado. Revisá tu email para los detalles del pago.</p>
        <Button onClick={() => { setIsSubmitted(false); setStep(0); setFormData({ name: '', surname: '', email: '', phone: '', message: '', appointmentDate: '', appointmentTime: '' }); }} className="rounded-full px-10 py-6 bg-[rgba(15,15,20,0.85)] text-white hover:bg-[rgba(15,15,20,0.95)] font-medium">Finalizar</Button>
      </motion.div>
    );
  }

  return (
    <div className="rounded-[2.5rem] glass-opaque p-6 sm:p-10 shadow-2xl border border-[rgba(255,255,255,0.5)] relative overflow-hidden min-h-[440px] sm:min-h-[520px]">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[rgba(135,206,250,0.08)] blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[rgba(216,180,226,0.08)] blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none" />
      <AnimatePresence mode="wait" custom={step}>
        <motion.div key={step} custom={step} initial={{ x: step > 0 ? 50 : -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: step < 0 ? 50 : -50, opacity: 0 }} className="relative z-10 h-full flex flex-col">
          {step === 0 && <StepIntro nextStep={() => setStep(1)} serviceName={serviceName} />}
          {step === 1 && <StepClientInfo formData={formData} handleChange={handleChange} nextStep={() => validateStep(1) && setStep(2)} prevStep={() => setStep(0)} errors={errors} />}
          {step === 2 && <StepDateSelection formData={formData} handleChange={handleChange} nextStep={() => validateStep(2) && setStep(3)} prevStep={() => setStep(1)} errors={errors} businessHours={businessHours} />}
          {step === 3 && <StepTimeSelection formData={formData} handleChange={handleChange} nextStep={() => validateStep(3) && setStep(4)} prevStep={() => setStep(2)} errors={errors} businessHours={businessHours} bookedSlots={bookedSlots} blockedTimes={blockedTimes} />}
          {step === 4 &&
          <StepFinal
            formData={formData}
            prevStep={() => setStep(3)}
            onSubmit={handleSubmit}
            errors={errors}
            serviceName={serviceName}
            bankDetails={bankDetails}
            handleCopy={handleCopy}
            copiedField={copiedField}
            isLoading={isLoading}
            acceptedLegal={acceptedLegal}
            setAcceptedLegal={setAcceptedLegal}
          />
          }
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
