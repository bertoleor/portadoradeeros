'use client';

import { useState, useEffect } from 'react';
import { ServiceCard } from '@/components/client/ServiceCard';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { Service } from '@/types';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
};

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('services')
        .select('*');
      
      console.log('Services raw data:', data);
      console.log('Services error:', error);

      if (data) {
        // Map snake_case from DB to camelCase for TypeScript type
        // Note: Supabase may return boolean as string 'true'/'false', so we convert explicitly
        const mappedServices: Service[] = data.map((s) => ({
          id: s.id,
          slug: s.slug,
          title: s.title,
          shortDescription: s.short_description,
          description: s.description || '',
          price: Number(s.price),
          duration: Number(s.duration),
          // Handle both boolean and string 'true'/'false' from Supabase
          isVisible: s.is_visible === true || s.is_visible === 'true',
          icon: s.icon,
          images: s.images || [],
        }));
        console.log('Mapped services:', mappedServices);
        setServices(mappedServices);
      }
      setLoading(false);
    };

    fetchServices();
  }, []);

  if (loading) {
    return (
      <section className="py-16 md:py-24 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14 md:mb-20">
            <span className="text-[11px] uppercase tracking-[0.3em] text-black/40 font-medium block mb-4">
              Servicios
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-light tracking-tight text-black">
              Lo que ofrezco
            </h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const visibleServices = services;

  return (
    <section className="py-16 md:py-24 px-6 md:px-10">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-14 md:mb-20">
          <span className="text-[11px] uppercase tracking-[0.3em] text-black/40 font-medium block mb-4">
            Servicios
          </span>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-light tracking-tight text-black">
            Lo que ofrezco
          </h1>
        </div>

        {/* Mobile: staggered masonry grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="md:hidden columns-1 sm:columns-2 gap-4 space-y-4 px-4 md:px-0"
        >
          {visibleServices.map((service, index) => {
            const isLarge = index % 3 === 0;
            return (
              <motion.div 
                key={service.id} 
                variants={itemVariants}
                className={isLarge ? 'break-after-avoid' : ''}
              >
                <ServiceCard 
                  service={service} 
                  index={index} 
                  featured={isLarge}
                  className={isLarge ? 'min-h-[200px] sm:min-h-[340px]' : 'min-h-[180px] sm:min-h-[280px]'}
                />
              </motion.div>
            );
          })}
        </motion.div>

        {/* Desktop: asymmetric diagonal bento grid */}
        <div className="hidden md:grid grid-cols-3 gap-5">
          {[...visibleServices]
            .sort((a, b) => {
              const order = ['tarot', 'velomancia', 'limpieza-energetica', 'buzios'];
              const idxA = order.indexOf(a.slug);
              const idxB = order.indexOf(b.slug);
              if (idxA !== -1 && idxB !== -1) return idxA - idxB;
              return 0;
            })
            .map((service, index) => {
              const isFeatured = index === 0 || index === 3 || index === 4 || index === 7;
              
              return (
                <div key={service.id} className={isFeatured ? 'col-span-2' : 'col-span-1'}>
                  <ServiceCard service={service} index={index} featured={isFeatured} />
                </div>
              );
            })}
        </div>

      </div>
    </section>
  );
}
