import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getServiceBySlug } from '@/lib/api/services';
import { ServiceIcon } from '@/components/ui/ServiceIcons';
import { ServiceContactForm } from '@/components/client/ServiceContactForm';
import { ServiceImageCarousel } from '@/components/client/ServiceImageCarousel';
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
  const bankDetails = {
    bankOwner: settings?.bankDetails?.bankOwner || '',
    bankName: settings?.bankDetails?.bankName || '',
    cbu: settings?.bankDetails?.cbu || '',
    alias: settings?.bankDetails?.alias || ''
  };

  return (
    <section className="py-12 md:py-20 px-4 sm:px-6 md:px-10 bg-transparent">
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
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/60 flex items-center justify-center shadow-sm"
                   style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                <ServiceIcon
                  type={service.icon}
                  size={24}
                  className="text-[rgba(15,15,20,0.72)]"
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

            {/* Redes sociales — pills */}
            {(settings?.socialLinks?.instagram || settings?.socialLinks?.whatsapp || settings?.socialLinks?.tiktok) && (
              <div className="flex flex-wrap items-center gap-2 mt-6 mb-8">

                {settings?.socialLinks?.instagram && (
                  <a
                    href={settings.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 hover:-translate-y-px hover:shadow-md"
                    style={{
                      background: 'rgba(255,255,255,0.35)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.55)',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(15,15,20,0.65)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <circle cx="12" cy="12" r="4"/>
                      <circle cx="17.5" cy="6.5" r="0.5" fill="rgba(15,15,20,0.65)" stroke="none"/>
                    </svg>
                    <span className="text-[12px] font-medium tracking-wide text-[rgba(15,15,20,0.70)]">Instagram</span>
                  </a>
                )}

                {settings?.socialLinks?.whatsapp && (
                  <a
                    href={settings.socialLinks.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 hover:-translate-y-px hover:shadow-md"
                    style={{
                      background: 'rgba(255,255,255,0.35)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.55)',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(15,15,20,0.65)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                    <span className="text-[12px] font-medium tracking-wide text-[rgba(15,15,20,0.70)]">WhatsApp</span>
                  </a>
                )}

                {settings?.socialLinks?.tiktok && (
                  <a
                    href={settings.socialLinks.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 hover:-translate-y-px hover:shadow-md"
                    style={{
                      background: 'rgba(255,255,255,0.35)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.55)',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    }}
                  >
                    <svg width="12" height="14" viewBox="0 0 24 24" fill="rgba(15,15,20,0.65)" stroke="none">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
                    </svg>
                    <span className="text-[12px] font-medium tracking-wide text-[rgba(15,15,20,0.70)]">TikTok</span>
                  </a>
                )}

              </div>
            )}
          </div>

          {/* Full width - Contact Form (below on PC) */}
          <div className="xl:col-span-12 mt-4 xl:mt-8">
            <div className="rounded-3xl p-6 sm:p-8 md:p-10">
              <h2 className="text-xl sm:text-2xl font-light tracking-tight text-[rgba(15,15,20,0.85)] mb-2">
                ¿Te interesa este servicio?
              </h2>
              <p className="text-sm sm:text-base text-[rgba(15,15,20,0.5)] mb-8 font-light">
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
