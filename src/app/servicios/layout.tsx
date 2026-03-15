import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Servicios | Portadora de Eros',
  description: 'Sesiones de tarot, buzios, limpieza energética y velomancia. Descubrí el servicio que mejor se adapta a tu camino espiritual.',
};

export default function ServiciosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
