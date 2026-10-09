'use client';

/**
 * Global error boundary — captures errors thrown in the root layout itself,
 * where `error.tsx` cannot (Next.js App Router convention).
 *
 * This MUST render its own `<html>` and `<body>` because the root layout is
 * not rendered in this path. We use inline styles (not Tailwind utility
 * classes) because the global stylesheet imported by the root layout is also
 * unavailable here. No error internals are surfaced to the end user.
 */
export default function GlobalError({
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#f8f9fb',
          color: '#111',
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center', padding: 24 }}>
          <p
            style={{
              fontSize: 12,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'rgba(0,0,0,0.4)',
            }}
          >
            Algo salió mal
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 300 }}>Ocurrió un error inesperado</h1>
          <p style={{ fontSize: 16, color: 'rgba(0,0,0,0.5)', fontWeight: 300 }}>
            No fue tu culpa. Intentá de nuevo.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 16,
              padding: '12px 32px',
              borderRadius: 999,
              border: '1px solid rgba(15,15,20,0.16)',
              background: 'transparent',
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
