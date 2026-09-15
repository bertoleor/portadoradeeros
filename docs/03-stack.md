# EROS — Framework / Stack

> Fuente: `package.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/globals.css`,
> `components.json`, `tsconfig.json`. Verificado 2026-09-15.

## Núcleo

| Capa        | Elección                                                              | Versión      |
| ----------- | --------------------------------------------------------------------- | ------------ |
| Framework   | Next.js App Router (SSR + server actions)                             | 16.1.6       |
| UI          | React + React Compiler (`reactCompiler: true`)                        | 19.2.3       |
| Lenguaje    | TypeScript strict                                                     | 5.x          |
| Estilos     | Tailwind CSS v4 (sin config file, `@theme` en CSS) + `tw-animate-css` | 4.2.1        |
| Componentes | shadcn + Radix Slot + Base UI                                         | shadcn 4.0.2 |
| Forms       | react-hook-form + Zod 4 (`@hookform/resolvers`)                       | —            |
| Animación   | framer-motion, lucide-react iconos                                    | 12.x / 0.577 |
| Fechas      | date-fns                                                              | 4.1.0        |
| Editor rico | TipTap (starter-kit + image/link/placeholder/text-align/underline)    | 3.20.1       |
| Sanitizado  | sanitize-html (bio admin)                                             | 2.17.7       |

## Backend / datos

| Capa                | Elección                                                                          |
| ------------------- | --------------------------------------------------------------------------------- |
| DB + Auth + Storage | Supabase (`@supabase/ssr` 0.9, `@supabase/supabase-js` 2.99)                      |
| Email               | EmailJS (`@emailjs/nodejs` 5) / Resend (plantillas en `src/lib/email-templates/`) |
| Push admin          | `web-push` 3.6.7 + tabla `push_subscriptions`                                     |
| Validación          | Zod 4 en formularios y API routes                                                 |

## Plataforma

- **Deploy:** Vercel (cron recordatorios, `remotePatterns` imágenes Supabase,
  `optimizePackageImports` para `lucide-react`/`date-fns`, AVIF/WebP).
- **PWA:** `manifest.json` (scope `/admin`), `sw.js`, `PWAHandler`, iconos en `public/icons`.
- **SEO:** `sitemap.ts`, `robots.ts`, OpenGraph `es_AR`, keywords tarot/buzios/limpieza/velomancia.

## Tooling

ESLint 9 (`eslint-config-next`, `jsx-a11y`, `security`, `sonarjs`, `unused-imports`) · Prettier 3 +
`prettier-plugin-tailwindcss` + `organize-imports` (⚠️ `tailwindConfig` apunta a archivo inexistente
— ver baseline-precommit) · Vitest 3 · Playwright · Husky 9 + lint-staged + guard `gga.sh` ·
Changesets · `cva` + `clsx` + `tailwind-merge`.
