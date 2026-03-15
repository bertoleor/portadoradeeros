'use client';

import { motion } from 'framer-motion';
import { User, CreditCard, Clock, Lock, Smartphone } from 'lucide-react';
import { SettingsCard } from '@/components/admin/SettingsCard';

const settingsSections = [
  {
    title: 'Perfil Público',
    description: 'Nombre, biografía y redes sociales',
    icon: User,
    href: '/admin/configuracion/perfil',
  },
  {
    title: 'Datos Bancarios',
    description: 'CBU, alias y datos para transferencias',
    icon: CreditCard,
    href: '/admin/configuracion/banco',
  },
  {
    title: 'Horarios de Trabajo',
    description: 'Días y horarios de atención',
    icon: Clock,
    href: '/admin/configuracion/horarios',
  },
  {
    title: 'Seguridad y Correo',
    description: 'Cambiar correo de admin y contraseña',
    icon: Lock,
    href: '/admin/configuracion/seguridad',
  },
  {
    title: 'Editar Admin',
    description: 'Nombre y foto de perfil (interno)',
    icon: User,
    href: '/admin/configuracion/admin',
  },
  {
    title: 'Instalar App',
    description: 'Descargar e instalar la PWA en tu dispositivo',
    icon: Smartphone,
    href: '/admin/configuracion/instalar',
  },
];

export default function ConfiguracionPage() {
  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-4xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-black mb-1">
            Configuración
          </h1>
          <p className="text-xs sm:text-sm text-black/50 font-light max-w-md">
            Administra tu perfil público y la configuración de tu cuenta.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {settingsSections.map((section, index) => (
            <motion.div
              key={section.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <SettingsCard
                title={section.title}
                description={section.description}
                icon={section.icon}
                href={section.href}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
