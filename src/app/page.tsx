import { Hero, AboutPreview, ContactCTA } from '@/components/client/Hero';
import { ServiceCarousel } from '@/components/client/ServiceCarousel';
import { getVisibleServices } from '@/lib/api/services';

export default async function HomePage() {
  const visibleServices = await getVisibleServices();

  return (
    <>
      <Hero />
      <ServiceCarousel initialServices={visibleServices} />
      <AboutPreview />
      <ContactCTA />
    </>
  );
}
