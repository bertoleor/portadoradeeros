# EROS — Repos relacionados

> Parte de: [[projects/eros/README|README]] · Relacionados: [[01-producto]] ·
> [[docs/proyectos/eros|eros]]

> Solo documentación. Búsqueda web 2026-09-15. Código intocado. Criterio: e-commerce open source
> reutilizable para una tienda como EROS (Next.js + Supabase + pagos LATAM). "Portadora" en telecom
> (modulación/enlace) no dio repos aplicables — se descartó.

## Reutilizables directos (Next.js + Supabase)

| Repo                                                   | Stack                                                                                                    | Qué aporta a EROS                                                                                                                                                                 |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `simonsruggi/next-store` (MIT)                         | Next.js 15 App Router, Tailwind, Supabase, Stripe + PayPal + COD, Zustand                                | El más cercano: catálogo + carrito persistente, checkout multi-paso, RLS, panel admin CRUD, productos digitales con links con expiración. Buena referencia para carrito/checkout. |
| `tarektech/ecommerce-supabase-Nextjs` (MIT)            | Next.js 15, React 19, TS, Supabase, shadcn/ui, Tailwind v4, TanStack Query                               | Admin de productos/órdenes/usuarios, reviews, direcciones múltiples, dark mode. Referencia para panel admin y RLS.                                                                |
| `KolbySisk/next-supabase-stripe-starter` (MIT, 800+ ★) | Next.js 15, Supabase, Stripe Checkout + subscriptions + customer portal, React Email + Resend, shadcn/ui | Webhooks Stripe↔Supabase, fixtures de productos, migraciones Supabase. Referencia para pagos recurrentes y emails.                                                                |

## Plataformas headless (si EROS escalara a catálogo grande)

| Repo                                       | Nota                                                                                                           |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `medusajs/medusa` (~31k ★)                 | Headless Node.js/Express, API-first, frontend componible. Overkill hoy, opción si el catálogo multiplica SKUs. |
| `saleor/saleor` (~22k ★)                   | Headless Python/Django, GraphQL-first, multi-canal. Alternativa si se necesita B2B/multi-tienda.               |
| `bagisto/bagisto` (~24k ★)                 | Laravel, multi-inventario/multi-vendor. Solo si se migrara fuera de Next.js.                                   |
| `yournextstore/yournextstore` (~5k ★, MIT) | Template Next.js + Stripe con editor visual. El backend es servicio propio con API key — ojo al lock-in.       |

## Pagos LATAM

| Repo                       | Nota                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| `oteka21/mercadopago-next` | Integración mínima Mercado Pago ↔ Next.js. Punto de partida para cobrar en ARS (Stripe no opera local). |

## Lo específico de tienda erótica (discreción)

No se encontraron repos open source de "erotic store" con tracción; es un nicho que se resuelve con
patrones genéricos, no con un fork:

- Facturación con descriptor neutro, paquetes sin branding explícito.
- Checkout sin login obligatorio + RLS estricta en órdenes/direcciones.
- Edad-gate simple + `robots`/`noindex` selectivo en categorías sensibles.
- Medios de pago locales (Mercado Pago) antes que Stripe.

## Recomendación

1. Tomar patrones de `simonsruggi/next-store` (carrito/checkout/RLS) y
   `KolbySisk/next-supabase-stripe-starter` (webhooks, emails) como referencia.
2. Integrar Mercado Pago con `oteka21/mercadopago-next` como base.
3. No adoptar Medusa/Saleor salvo que el catálogo lo exija.
