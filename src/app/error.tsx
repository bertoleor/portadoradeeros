'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { buttonVariants } from '@/components/ui/button-variants';
import { logger } from '@/lib/logger';

/**
 * Route-level error boundary (Next.js App Router convention).
 * Renders inside the root layout, replacing the crashed segment.
 * Does NOT surface error internals to the end user — only a neutral message
 * and recovery actions (reset / go home).
 */
export default function Error({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    // Dev-only diagnostics; never surfaces internals to users in any env.
    logger.error('Route error boundary caught an error', {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 md:px-10">
      <div className="max-w-md mx-auto text-center py-16">
        <span className="text-xs uppercase tracking-[0.3em] text-black/40 font-medium block mb-4">
          Algo salió mal
        </span>
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-black mb-6">
          Ocurrió un error inesperado
        </h1>
        <p className="text-base text-black/50 leading-relaxed font-light mb-10">
          No fue tu culpa. Podés intentar de nuevo o volver al inicio.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className={buttonVariants({ variant: 'default', size: 'lg' })}
          >
            Reintentar
          </button>
          <Link
            href="/"
            className={buttonVariants({ variant: 'outline', size: 'lg' })}
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}