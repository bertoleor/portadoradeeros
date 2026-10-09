'use client';

import { usePathname } from 'next/navigation';

import { Footer } from './Footer';
import { Navbar } from './Navbar';

import type { ReactNode } from 'react';

export function Shell({ children }: { readonly children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') || false;

  if (isAdmin) {
    return <main className="flex-grow flex flex-col min-h-screen">{children}</main>;
  }

  return (
    <>
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-grow flex flex-col pt-20 min-h-[calc(100vh-8rem)] focus:outline-none"
      >
        {children}
      </main>
      <Footer />
    </>
  );
}
