import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getServiceBySlug } from '@/lib/api/services';
import { ServiceIcon } from '@/components/ui/ServiceIcons';
import { ServiceContactForm } from '@/components/client/ServiceContactForm';
import { ServiceImageCarousel } from '@/components/client/ServiceImageCarousel';
import { ScrollToFormButton } from '@/components/client/ScrollToFormButton';
import { Clock, Sparkles } from 'lucide-react';
import { getAdminSettings } from '@/lib/api/settings';

interface PageProps {
  params: Promise<{ slug: string }>;
}


export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    return { title: 'Servicio no encontrado' };
  }

  return {
    title: `${service.title} | Portadora de Eros`,
    description: service.shortDescription,
    openGraph: {
      title: `${service.title} | Portadora de Eros`,
      description: service.shortDescription,
    },
  };
}

export default async function ServicioDetalle({ params }: { readonly params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  
  // Fetch in parallel for speed
  const [service, settings] = await Promise.all([
    getServiceBySlug(resolvedParams.slug),
    getAdminSettings()
  ]);

  if (!service?.isVisible) {
    notFound();
  }

  // Fallback if settings aren't configured yet
  const bankDetails = settings?.bankDetails || {
    bankOwner: '',
    bankName: '',
    cbu: '',
    alias: ''
  };

  return (
    <section className="py-12 md:py-20 px-4 sm:px-6 md:px-10">
      <div className="max-w-6xl mx-auto">
        {/* Mobile: stacked layout | PC: horizontal layout with form below */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-12">
          
          {/* Left Column - Images (top on mobile, left on PC) */}
          <div className="xl:col-span-7">
            <ServiceImageCarousel 
              images={service.images} 
              className="w-full"
            />
          </div>

          {/* Right Column - Info (middle on mobile, right on PC) */}
          <div className="xl:col-span-5 xl:flex xl:flex-col xl:justify-center">
            {/* Icon */}
            <div className="mb-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black flex items-center justify-center">
                <ServiceIcon
                  type={service.icon}
                  size={24}
                  className="text-white/70"
                />
              </div>
            </div>

            {/* Badge */}
            <span className="text-xs uppercase tracking-[0.3em] text-black/40 font-medium block mb-3">
              Servicio
            </span>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-black mb-4 sm:mb-6">
              {service.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="flex items-center gap-1.5 text-sm text-black/40">
                <Clock size={15} />
                <span>{service.duration} minutos</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-black/40">
                <Sparkles size={15} />
                <span>Sesión individual</span>
              </div>
            </div>

            {/* Description */}
            <div className="prose prose-lg max-w-none mb-8 sm:mb-10">
              <p className="text-base md:text-lg text-black/60 leading-relaxed font-light">
                {service.description}
              </p>
            </div>

            {/* Quick Action Button (Mobile optimization) */}
            <div className="flex xl:hidden mb-8">
              <ScrollToFormButton label="Agendar Consulta" />
            </div>
          </div>

          {/* Full width - Contact Form (below on PC) */}
          <div className="xl:col-span-12 mt-4 xl:mt-8">
            <div className="bg-white border border-black/5 rounded-3xl shadow-sm p-6 sm:p-8 md:p-10">
              <h2 className="text-xl sm:text-2xl font-light tracking-tight text-black mb-2">
                ¿Te interesa este servicio?
              </h2>
              <p className="text-sm sm:text-base text-black/40 mb-8 font-light">
                Completá el formulario para agendar tu consulta o solicitar más información.
              </p>
              <div className="max-w-xl">
                <ServiceContactForm
                  serviceName={service.title}
                  serviceId={service.id}
                  serviceDuration={service.duration}
                  bankDetails={bankDetails}
                  businessHours={settings?.businessHours as Record<string, { closed: boolean; start: string; end: string }>}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
