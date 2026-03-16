import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button-variants';
import { ArrowRight, Sparkles, Eye, Heart } from 'lucide-react';
import { FadeIn } from '@/components/ui/FadeIn';
import { getAdminSettings } from '@/lib/api/settings';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Sobre Mí | Portadora de Eros',
  description: 'Conocé a la guía espiritual detrás de Portadora de Eros. Canalizadora, tarotista y puente entre lo terrenal y lo místico.',
};

const values = [
  {
    icon: Sparkles,
    title: 'Sabiduría Ancestral',
    description: 'Honro las tradiciones que me fueron transmitidas, respetando cada herramienta espiritual con la profundidad que merece.',
  },
  {
    icon: Eye,
    title: 'Claridad & Verdad',
    description: 'Mi compromiso es con la verdad de lo que las herramientas revelan. Sin adornos, sin filtros — solo lo que necesitás escuchar.',
  },
  {
    icon: Heart,
    title: 'Conexión Genuina',
    description: 'Cada sesión es un espacio sagrado de confianza. Te acompaño con empatía y respeto en tu proceso espiritual.',
  },
];

export default async function SobreMiPage() {
  const settings = await getAdminSettings();

  return (
    <div className="py-16 md:py-24 px-6 md:px-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 md:mb-24">
          <span className="text-xs uppercase tracking-[0.3em] text-black/40 font-medium block mb-4">
            Sobre Mí
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-black mb-6">
            Portadora de Eros
          </h1>
          <p className="text-base md:text-lg text-black/50 leading-relaxed font-light max-w-2xl mx-auto">
            Guía espiritual, canalizadora y puente entre lo terrenal y lo místico.
          </p>
        </div>

        {/* Profile Image if exists */}
        {settings?.profileImageUrl && (
          <FadeIn delay={0.1} direction="up" distance={15} className="mb-20">
            <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
              <Image 
                src={settings.profileImageUrl} 
                alt="Portadora de Eros" 
                fill 
                className="object-cover"
                sizes="(max-w-768px) 100vw, 1200px"
              />
            </div>
          </FadeIn>
        )}

        {/* Bio Section */}
        <div className="max-w-2xl mx-auto mb-20 md:mb-28">
          <FadeIn delay={0.2} direction="up" distance={15}>
            <div 
              className="prose prose-sm md:prose-base prose-black max-w-none text-black/60 font-light leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: settings?.bioContent || `
                  <p>Desde muy joven sentí una conexión profunda con lo espiritual. Lo que comenzó
                  como una curiosidad innata se convirtió en mi camino de vida: ser puente entre
                  los mundos visible e invisible.</p>
                  <p>A lo largo de los años me formé en diversas disciplinas esotéricas — el tarot,
                  los buzios de la tradición africana, la velomancia y las técnicas de limpieza
                  energética. Cada herramienta me fue transmitida con respeto y profundidad,
                  y así es como las comparto con quienes buscan respuestas.</p>
                  <p>Mi misión es acompañarte en tu proceso espiritual con honestidad, empatía
                  y la sabiduría que las herramientas ancestrales nos ofrecen. No prometo
                  milagros — prometo un espacio seguro para explorar tu verdad.</p>
                ` 
              }} 
            />
          </FadeIn>
        </div>

        {/* Values Section */}
        <div className="mb-20 md:mb-28">
          <FadeIn delay={0.1} direction="up">
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-center mb-12">
              Mi filosofía
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {values.map((value, idx) => (
              <FadeIn key={value.title} delay={0.2 + idx * 0.1} direction="up" distance={20} className="h-full">
                <div className="h-full rounded-2xl glass-dark p-7 md:p-8 hover:border-white/20 transition-colors">
                  <value.icon size={24} className="text-white mb-4" strokeWidth={1.5} />
                  <h3 className="text-base font-medium mb-2">{value.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed font-light">{value.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>

        {/* CTA */}
        <FadeIn delay={0.2} direction="up" distance={20}>
          <div className="text-center">
            <p className="text-base text-black/50 font-light mb-6">
              ¿Querés saber más o agendar una sesión?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contacto" className={buttonVariants({ variant: "default", size: "lg" })}>
                Contactar
              </Link>
              <Link href="/servicios" className={buttonVariants({ variant: "outline", size: "lg", className: "rounded-full" })}>
                Ver Servicios
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
