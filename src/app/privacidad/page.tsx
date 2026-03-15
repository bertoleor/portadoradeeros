import type { Metadata } from 'next';
import { FadeIn } from '@/components/ui/FadeIn';

export const metadata: Metadata = {
  title: 'Privacidad | Portadora de Eros',
  description: 'Tratamiento de datos personales y compromiso de confidencialidad.',
};

export default function PrivacidadPage() {
  return (
    <div className="py-16 md:py-24 px-6 md:px-10">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-16 md:mb-24">
          <span className="text-[10px] uppercase tracking-[0.4em] text-black/40 font-medium block mb-4">
            Datos
          </span>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-black mb-6">
            Política de Privacidad
          </h1>
          <p className="text-sm md:text-base text-black/50 font-light max-w-xl mx-auto leading-relaxed">
            Tu confianza es la base de mi trabajo. Tus datos están protegidos y son utilizados exclusivamente para la gestión de tus turnos.
          </p>
        </header>

        <FadeIn delay={0.1} direction="up" distance={20}>
          <div className="space-y-12 text-black/70 font-light leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-xl font-medium text-black tracking-tight italic">1. Información Recopilada</h2>
              <p>
                Solicito únicamente los datos necesarios para identificarte y contactarte en relación a tus sesiones: Nombre, Apellido, Email y Teléfono.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-black tracking-tight italic">2. Uso de los Datos</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Confirmación y recordatorios de turnos vía Email o WhatsApp.</li>
                <li>Gestión de pagos y validación de comprobantes.</li>
                <li>Comunicación directa en caso de cambios en la agenda.</li>
              </ul>
              <p className="mt-4">
                <strong>No utilizo tus datos para spam</strong> ni para el envío de boletines informativos sin tu consentimiento explícito previo.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-black tracking-tight italic">3. Compromiso de No Divulgación</h2>
              <p>
                Tus datos personales y el contenido de nuestras conversaciones son <strong>privados y confidenciales</strong>. No vendo, alquilo ni comparto tu información con ninguna empresa o tercero, bajo ninguna circunstancia ajena a la prestación técnica del servicio (ej. plataforma de hosting o base de datos).
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-black tracking-tight italic">4. Derechos del Usuario</h2>
              <p>
                Podés solicitar en cualquier momento la rectificación o eliminación total de tus datos de mi base de datos contactándome directamente por WhatsApp o Email.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-medium text-black tracking-tight italic">5. Seguridad</h2>
              <p>
                Este sitio utiliza protocolos seguros (HTTPS/SSL) para garantizar que la información que envíes viaje de forma encriptada y segura.
              </p>
            </section>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
