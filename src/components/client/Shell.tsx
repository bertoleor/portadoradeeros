'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ReactNode } from 'react';

export function Shell({ children }: { readonly children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') || false;

  if (isAdmin) {
    return <main className="flex-grow flex flex-col min-h-screen bg-gray-50">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow flex flex-col pt-16 min-h-[calc(100vh-8rem)]">
        {children}
      </main>
      <Footer />
    </>
  );
}
