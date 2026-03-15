'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function ConfiguracionLayout({ children }: { readonly children: React.ReactNode }) {
  const pathname = usePathname();
  const isMainConfig = pathname === '/admin/configuracion';
  const backHref = isMainConfig ? '/admin' : '/admin/configuracion';
  const backLabel = isMainConfig ? 'Volver al panel' : 'Volver a configuración';

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Breadcrumb */}
        <Link 
          href={backHref}
          className="inline-flex items-center gap-1 text-xs text-black/40 hover:text-black/70 transition-colors mb-6"
        >
          <ChevronLeft size={14} />
          {backLabel}
        </Link>

        {children}
      </motion.div>
    </div>
  );
}
