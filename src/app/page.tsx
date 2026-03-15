import { Hero, AboutPreview, ContactCTA } from '@/components/client/Hero';
import { ServiceCarousel } from '@/components/client/ServiceCarousel';
import { getServices } from '@/lib/api/services';

export default async function HomePage() {
  const allServices = await getServices();
  const visibleServices = allServices.filter(s => s.isVisible);

  return (
    <>
      <Hero />
      <ServiceCarousel initialServices={visibleServices} />
      <AboutPreview />
      <ContactCTA />
    </>
  );
}
