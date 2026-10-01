# EROS — Producto: qué es y funciones

> **Búsqueda:** keywords: `eros, producto, catalogo, actores, rutas, reserva` · clasificación:
> `producto` · estado: `canónico` · actualizado: 2026-09-30 Relacionados:
> [[projects/eros/README|README]] · [[PRD-eros-minimo]] · [[F0-2026-09-27]] ·
> [[docs/proyectos/eros|eros]]

> Fuente: `src/app/*`, `src/components/client/*`, `src/lib/api/*`, `supabase_schema.sql`,
> `supabase_seed.sql`, `public/manifest.json`. Verificado 2026-09-30.

## Qué es

**Portadora de Eros** — sitio monolingüe es-AR de servicios esotéricos con reserva de turnos y panel
admin. Un solo operador (Jacque). Sin gateway de pago: **reserva + transferencia manual** (sin
superficie PCI). Publicado como PWA (scope `/admin`).

## Catálogo (seed verificado)

| Slug                  | Título              | Precio (ARS seed) | Duración |
| --------------------- | ------------------- | ----------------- | -------- |
| `tarot`               | Sesión de Tarot     | 5000              | 60 min   |
| `buzios`              | Sesión de Buzios    | 6000              | 90 min   |
| `limpieza-energetica` | Limpieza Energética | 8000              | 120 min  |
| `velomancia`          | Velomancia          | 7000              | 75 min   |

Cada servicio: página de detalle `/servicios/[slug]` (imagen, descripción, CTA "Agendar") + flag
`is_visible` que controla la vidriera pública.

## Actores

| Rol            | Capacidad                                                | Mecanismo                                                                                   |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Visitante      | Ve servicios, reserva turno, contacta                    | `ServiceContactForm` → server action `createAppointment()`; `POST /api/contact`             |
| Cliente        | Recibe confirmación por email + datos bancarios          | EmailJS/Resend, 6 plantillas (`src/lib/email*`)                                             |
| Admin (Jacque) | Calendario, clientes, mensajes, servicios, configuración | Supabase Auth + allowlist `is_admin()` (ADR-0001), gate doble `proxy.ts` + `requireAdmin()` |
| Sistema        | Recordatorios, push, storage                             | Cron Vercel `/api/cron/reminders`, `web-push`, Supabase Storage `public-images`             |

## Rutas

**Públicas:** `/`, `/servicios`, `/servicios/[slug]`, `/sobre-mi`, `/contacto`,
`/politica-cancelacion`, `/privacidad`, `/terminos`. **Admin:** `/admin` (dashboard),
`/admin/bienvenida`, `/admin/servicios[/[slug]]`, `/admin/calendario`, `/admin/clientes[/[id]]`,
`/admin/mensajes`, `/admin/configuracion/{perfil,banco,horarios,seguridad,admin,instalar}`,
`/admin/login`.

## Funciones públicas

- **Home:** `Hero` → `ServiceCarousel` → `AboutPreview` → `ContactCTA`.
- **Reserva (flujo central):** servicio → formulario multi-paso (datos → fecha/hora → instrucciones
  de transferencia) → validación Zod → `createAppointment()` inserta en `appointments` +
  `sendPushToAdmins` → email confirmación al cliente + notificación al admin. Datos bancarios
  (`titular/CBU/alias`) desde `admin_settings`, mostrados en el paso final.
- **Contacto:** `POST /api/contact` (guarda mensaje + email al admin).
- **Sobre-mí:** bio editable desde admin (`bio_content`, sanitizada con `sanitizeBioContent`).
- **Legales:** términos, privacidad, política de cancelación (páginas estáticas).
- **SEO/PWA:** `sitemap.ts`, `robots.ts` (bloquea `/admin/`, `/api/`), PWA admin (`manifest.json`,
  `sw.js`, `PWAHandler`).

## Funciones admin

- **Dashboard:** métricas, turnos pendientes, mensajes.
- **Calendario:** vista mes/semana/día, bloqueos (`blocked_times`), confirmar/completar/cancelar
  turnos.
- **Clientes:** lista + historial por cliente.
- **Mensajes:** bandeja de contacto (cambio de estado).
- **Servicios:** CRUD completo (título, slug, precio, duración, visibilidad, icono, imágenes vía
  Storage).
- **Configuración:** perfil/redes/bio, datos bancarios, horarios (`business_hours` JSONB),
  seguridad/correo, PWA/instalar.

## Riesgo conocido

**Resuelto 2026-09-30 (verificación de este refresh):** el doble camino de reserva fue eliminado —
la ruta huérfana `POST /api/appointments` ya no existe (`src/app/api/` solo contiene `admin/`,
`contact/`, `cron/`). Camino canónico único: server action `createAppointment()` con rate-limit +
honeypot (`src/lib/spam-protection.ts`, 5 req/60s). Historia: ver
`openspec/changes/remove-orphan-booking-route/` y `reports/project-analysis/eros-producto-g1.md`.
