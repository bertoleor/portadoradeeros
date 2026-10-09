import { FadeIn } from '@/components/ui/FadeIn';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Cancelación | Portadora de Eros',
  description: 'Información sobre cancelaciones, reembolsos y reprogramación de turnos.',
};

export default function PoliticaCancelacionPage() {
  return (
    <div className="py-16 md:py-24 px-6 md:px-10">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-16 md:mb-24">
          <span className="text-[10px] uppercase tracking-[0.4em] text-black/60 font-medium block mb-4">
            Políticas
          </span>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-black mb-6">
            Cancelación y Reembolsos
          </h1>
          <p className="text-sm md:text-base text-black/60 font-light max-w-xl mx-auto leading-relaxed">
            Entiendo que pueden surgir imprevistos. Mi compromiso es brindarte un servicio
            respetuoso y organizado.
          </p>
        </header>

        <FadeIn delay={0.1} direction="up" distance={20}>
          <div className="space-y-12 text-black/70 font-light leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-xl font-medium text-black tracking-tight italic">
                1. Avisos de Cancelación
              </h2>
              <p>
                Para cancelar una sesión programada y tener derecho a un reembolso o reprogramación,
                deberás notificar con al menos <strong>24 horas de anticipación</strong> a la hora
                del turno.
              </p>
              <p>
                La notificación debe realizarse preferentemente a través de nuestro canal de
                WhatsApp oficial, citando tu nombre y la fecha/hora del turno original.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-black tracking-tight italic">
                2. Política de Reembolso
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="p-6 rounded-2xl bg-black/[0.02] border border-black/5">
                  <h3 className="text-sm font-medium text-black mb-2 italic">Aviso +24hs</h3>
                  <p className="text-sm">
                    Se realizará un <strong>reembolso completo</strong> del importe abonado o se
                    procederá a la reprogramación sin cargo adicional.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-red-500/[0.02] border border-red-500/10">
                  <h3 className="text-sm font-medium text-red-900 mb-2 italic">
                    Aviso -24hs o No-show
                  </h3>
                  <p className="text-sm">
                    Si la cancelación ocurre con menos de 24 horas de aviso, o si no te presentás a
                    la sesión, <strong>no se efectuará reembolso</strong> ni crédito para futuras
                    sesiones.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-black tracking-tight italic">
                3. Reprogramaciones
              </h2>
              <p>
                Solo se permite <strong>una (1) reprogramación</strong> por turno por el mismo
                importe abonado, siempre que se cumpla el aviso de 24 horas. Solicitudes de cambio
                posteriores serán tratadas como un nuevo turno.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-black tracking-tight italic">
                4. Cancelación por parte de la Guía
              </h2>
              <p>
                En el caso excepcional de que deba cancelar o reprogramar tu turno por motivos
                personales o de fuerza mayor, se te notificará de inmediato y tendrás la opción de
                elegir una nueva fecha prioritaria o recibir el{' '}
                <strong>reembolso inmediato del 100%</strong> de tu dinero.
              </p>
            </section>

            <div className="pt-10 border-t border-black/5 text-center">
              <p className="text-xs uppercase tracking-widest text-black/60">
                Tu agendamiento es un compromiso mutuo de tiempo y energía.
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
