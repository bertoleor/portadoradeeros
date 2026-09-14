import type { Metadata, Viewport } from 'next';

import localFont from 'next/font/local';

import BackgroundMesh from '@/components/client/BackgroundMesh';
import { Shell } from '@/components/client/Shell';
import { PWAHandler } from '@/components/pwa/PWAHandler';
import { cn } from '@/lib/utils';
import './globals.css';

const geist = localFont({
  src: '../fonts/Geist-Latin.woff2',
  variable: '--font-sans',
  weight: '100 900',
  display: 'swap',
});

const playfair = localFont({
  src: [
    { path: '../fonts/PlayfairDisplay-Latin.woff2', weight: '400 900', style: 'normal' },
    { path: '../fonts/PlayfairDisplay-LatinItalic.woff2', weight: '400 900', style: 'italic' },
  ],
  variable: '--font-serif',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
  title: 'Portadora de Eros | Servicios Esotéricos',
  description:
    'Sesiones de tarot, buzios, limpieza energética y velomancia. Conectando con la sabiduría ancestral para guiarte en tu camino espiritual.',
  keywords: [
    'tarot',
    'esoterico',
    'buzios',
    'limpieza energetica',
    'velomancia',
    'adivinacion',
    'espiritualidad',
  ],
  authors: [{ name: 'Portadora de Eros' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Portadora de Eros',
  },
  openGraph: {
    title: 'Portadora de Eros | Servicios Esotéricos',
    description:
      'Guía espiritual, canalizadora y puente entre lo terrenal y lo místico. Sesiones de tarot, buzios y limpieza energética.',
    url: 'https://portadoradeeros.com',
    siteName: 'Portadora de Eros',
    type: 'website',
    locale: 'es_AR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portadora de Eros | Guía Espiritual',
    description:
      'Conectando con la esencia mística para iluminar tu camino. Tarot, Buzios y Velomancia.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn('font-sans', geist.variable)}>
      <body
        className={`${geist.variable} ${playfair.variable} font-sans antialiased text-black bg-[#f8f9fb] flex flex-col min-h-screen selection:bg-black selection:text-white`}
      >
        <BackgroundMesh />
        <PWAHandler />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
