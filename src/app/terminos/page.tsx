import { FadeIn } from '@/components/ui/FadeIn';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Portadora de Eros',
  description: 'Marco legal, propiedad intelectual y condiciones de servicio de Portadora de Eros.',
};

export default function TerminosPage() {
  return (
    <div className="py-16 md:py-24 px-6 md:px-10">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-16 md:mb-24">
          <span className="text-[10px] uppercase tracking-[0.4em] text-black/40 font-medium block mb-4">
            Legal
          </span>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-black mb-6">
            Términos y Condiciones
          </h1>
          <p className="text-sm md:text-base text-black/50 font-light max-w-xl mx-auto leading-relaxed">
            Última actualización: Marzo 2026. Al utilizar este sitio y contratar mis servicios, aceptás los siguientes términos.
          </p>
        </header>

        <FadeIn delay={0.1} direction="up" distance={20}>
          <div className="space-y-12 text-black/70 font-light leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-xl font-medium text-black tracking-tight italic">1. Naturaleza de los Servicios</h2>
              <p>
                Los servicios ofrecidos por <strong>Portadora de Eros</strong> (en adelante, &quot;la Guía&quot;) son de carácter espiritual, esotérico y de acompañamiento personal. 
                Se basan en herramientas ancestrales como el Tarot, buzios y canalizaciones.
              </p>
              <div className="p-6 bg-black/[0.02] border border-black/5 rounded-2xl">
                <p className="text-sm font-medium text-black mb-2 italic">Deslinde de Responsabilidad Médica:</p>
                <p className="text-sm">
                  Estas consultas <strong>no reemplazan</strong> bajo ningún concepto el diagnóstico, tratamiento o consejo de profesionales de la salud, psicología o psiquiatría. 
                  Si estás atravesando una emergencia de salud mental, por favor contactá con los servicios correspondientes de tu jurisdicción.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-black tracking-tight italic">2. Propiedad Intelectual</h2>
              <p>
                El nombre comercial <strong>&quot;Portadora de Eros&quot;</strong>, la identidad visual, el diseño de este sitio web, los textos y los contenidos generados son propiedad exclusiva de Jacque (Portadora de Eros).
              </p>
              <p className="p-4 border-l-2 border-black/10 pl-6 italic">
                Queda expresamente prohibida la reproducción total o parcial, copia, imitación o uso comercial de cualquier elemento de este sitio sin autorización previa por escrito. Cualquier infracción será gestionada legalmente bajo las leyes de propiedad intelectual de la República Argentina.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-black tracking-tight italic">3. Confidencialidad y Privacidad</h2>
              <p>
                Todo lo conversado y revelado dentro del espacio de una sesión es estrictamente confidencial. La Guía se compromete a no divulgar información personal ni el contenido de las lecturas a terceros, salvo requerimiento legal expreso.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-black tracking-tight italic">4. Edad Mínima</h2>
              <p>
                Para contratar cualquier servicio o realizar una reserva, el usuario debe ser mayor de 18 años o contar con capacidad legal verificable según las leyes de su país de residencia.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-black tracking-tight italic">5. Jurisdicción</h2>
              <p>
                Cualquier controversia derivada del uso de este sitio o la prestación de servicios se regirá por las leyes de la República Argentina, sometiéndose a la jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.
              </p>
            </section>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
