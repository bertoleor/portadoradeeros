# PRD — Portadora de Eros: reserva de turnos + panel admin (producto mínimo)

> **Búsqueda:** keywords:
> `eros, prd, portadora-de-eros, servicios-esotericos, reserva-de-turnos, panel-admin, transferencia-manual`
> · clasificación: `producto` · estado: `draft` · actualizado: 2026-10-18

> Parte de: [[INDICE-PLANS]] · Relacionados: [[PRD-TEMPLATE]] · [[EROS-plan-2026-09-14]] ·
> [[docs/proyectos/eros|eros]]

> Proyecto: eros (Portadora de Eros) · Autor: 19-writer (Technical Writer, flota Hermes) · Fecha:
> 2026-10-18 Estado: DRAFT Links: kanban `t_c90f05f8` (rework P17-1, revisión `t_99bc1b88`) ·
> [ADR-0001 admin allowlist](../adr/0001-admin-allowlist-is-admin.md) ·
> [ADR-0002 timezone canónico](../adr/0002-timezone-canonical.md) ·
> [`01-producto.md`](../01-producto.md) · auditoría
> `E:/Hermes/docs/audits/2026-10-16-revision-p17-1-prds.md`

> Fuentes verificadas (2026-10-18): `README.md`, `docs/01-producto.md`, `docs/03-stack.md`,
> `docs/06-marketing.md`, `docs/STATUS.md`, `docs/adr/`. Este PRD describe el producto existente y
> no habilita escritura: todo cambio pasa por SDD.

## Producto en una línea

Sitio web es-AR de **servicios esotéricos con reserva de turnos online y panel admin para un solo
operador (Jacque)**: vidriera de 4 servicios, agenda con recordatorios y cobro por transferencia
manual — sin gateway de pagos ni superficie PCI. Publicado como PWA en Vercel
(`portadoradeeros.com`).

**Caso de uso central:** la clienta reserva self-service (elige servicio → fecha/hora → recibe por
email confirmación + datos de transferencia) y Jacque gestiona el turno desde el panel (confirmar,
completar, cancelar, bloqueos de agenda).

## 1. Problema

Un negocio esotérico unipersonal necesita vender y agendar sin depender de la mensajería informal de
redes (Instagram/TikTok/WhatsApp son hoy los canales de descubrimiento junto al SEO orgánico).
Duelen dos lados:

- **La clienta (es-AR):** sin un lugar único no ve catálogo, precios ni duraciones, no puede
  autoseleccionar día y horario, ni recibir los datos de pago sin ida y vuelta por DM.
- **La operadora (Jacque):** agenda, clientas, mensajes y cobros gestionados a mano y dispersos en
  chats, con riesgo de perder turnos.

El producto existente resuelve ambos: catálogo público con reserva self-service y un panel PWA desde
donde Jacque corre todo el negocio sola.

## 2. Contexto

- Producto **ya construido y desplegado**: PWA sobre Vercel (dominio `portadoradeeros.com`), cron
  diario de recordatorios (`/api/cron/reminders`), rama de integración canónica `feat/eros-deps`
  (`docs/STATUS.md`).
- Stack: Next.js 16 (App Router) + React 19 + TypeScript strict · Tailwind CSS v4 · Supabase
  (DB/Auth/Storage) · shadcn + Base UI · Zod 4 + react-hook-form (`docs/03-stack.md`).
- Reserva por **server action** `createAppointment()` con rate-limit (5 req/60s) + honeypot; la ruta
  huérfana `POST /api/appointments` fue eliminada (verificado 2026-09-30, `docs/01-producto.md`).
- Auth admin con allowlist `is_admin()` (ADR-0001) y gate doble `src/proxy.ts` + `requireAdmin()`.
- Schema canónico en `migrations/` (`0001_canonical_schema.sql` + RLS allowlist; linaje en
  `migrations/README.md`); timezone canónico según ADR-0002.
- Este archivo reemplaza el placeholder de P17 (copía de la plantilla de portada sin contenido de
  producto — hallazgo F1 de la revisión P17-1).

## 3. Scope explícito (lo que ES el producto)

**Vidriera pública es-AR** — home (Hero → carrusel de servicios → sobre-mí → CTA), `/servicios`,
`/servicios/[slug]` con flag de visibilidad `is_visible`, `/sobre-mi` (bio editable y sanitizada),
`/contacto` (mensaje + email al admin) y legales (privacidad, términos, política de cancelación).
Catálogo seed:

| Servicio            | Precio (ARS) | Duración |
| ------------------- | ------------ | -------- |
| Sesión de Tarot     | 5000         | 60 min   |
| Sesión de Buzios    | 6000         | 90 min   |
| Limpieza Energética | 8000         | 120 min  |
| Velomancia          | 7000         | 75 min   |

**Reserva (flujo central, sin cuenta de clienta)** — formulario multi-paso (datos → fecha/hora →
instrucciones de transferencia con datos bancarios desde `admin_settings`), validación Zod;
`createAppointment()` persiste en `appointments` + email de confirmación a la clienta (Resend con
fallback SMTP, 6 plantillas) + push a admins (web-push VAPID).

**Panel admin (PWA, scope `/admin`)** — dashboard con métricas; calendario mes/semana/día con
bloqueos (`blocked_times`) y ciclo confirmar/completar/cancelar; clientas + historial por clienta;
bandeja de mensajes con cambio de estado; CRUD de servicios (título, slug, precio, duración,
visibilidad, icono, imágenes vía Supabase Storage); configuración (perfil/redes/bio, datos
bancarios, horarios `business_hours` JSONB, seguridad/correo, instalar PWA).

**Operación** — cron diario de recordatorios + emails transaccionales, push admin para respuesta
rápida, SEO (`sitemap.ts`, `robots.ts` bloquea `/admin/` y `/api/`).

## 4. NO-scope

- **Gateway de pagos online** (MercadoPago/Stripe): no entra — cobro por transferencia manual, sin
  superficie PCI. Decisión vigente, no deuda; ningún copy promete checkout online.
- **Cuentas/login para clientas**: no entra — la reserva es de visitante; solo el admin se
  autentica.
- **i18n**: no entra — monolingüe es-AR.
- **Blog/contenido SEO, OG images por servicio, testimonios en home, unificación de dominio
  canónico**: fuera por ahora (gaps registrados en `docs/06-marketing.md`).
- **App nativa**: no — PWA (manifest + service worker, scope admin).

## 5. Restricciones

- **Un solo operador**: todo el flujo admin debe ser operable por Jacque sola; el PWA admin es la
  ventaja de respuesta rápida (menor tiempo de respuesta = conversión).
- **Copys es-AR con voseo** (voz de marca en `docs/04-branding.md`); jamás prometer pago online.
- Dependencias externas: Supabase (DB/Auth/Storage), Resend o SMTP según `EMAIL_PROVIDER`, web-push
  (VAPID), Vercel (cron + env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` solo server, `NEXT_PUBLIC_APP_URL`).
- Código: TypeScript strict; CI obligatorio (`pnpm lint`, `typecheck`, `test`, `test:e2e`,
  `format:check`, gitleaks); `supabase_schema.sql` es legacy, el canónico vive en `migrations/`.
- Docs: `docs/` es la única fuente documental; cada dato se edita una sola vez en su canónico (regla
  de mantenimiento de `docs/STATUS.md`).

## 6. Criterios de éxito medibles

- [ ] Reserva end-to-end self-service: visitante completa el formulario y el turno queda en
      `appointments` + email con datos bancarios + push al admin, sin intervención de la operadora
      (camino canónico único `createAppointment()`).
- [ ] 0 rutas huérfanas de reserva (`src/app/api/` sin `appointments/`).
- [ ] Rate-limit efectivo: máximo 5 requests/60s por IP en formularios públicos
      (`src/lib/spam-protection.ts`).
- [ ] CI verde en los 4 gates: `pnpm lint` · `pnpm typecheck` · `pnpm test` (vitest) ·
      `pnpm test:e2e` (Playwright).
- [ ] Admin autosuficiente: alta/baja/edición de servicios, horarios y datos bancarios sin SQL a
      mano.
- [ ] `robots.ts` bloquea `/admin/` y `/api/`; sitemap solo con páginas públicas.

## 7. Fases SDD sugeridas

El producto existe; los próximos incrementos salen de los gaps registrados en
`docs/06-marketing.md`:

1. **Explore** — priorizar el primer gap: medición de conversión del embudo, OG images por servicio,
   unificación de dominio canónico (`portadoradeeros.com` vs fallback) o prueba social (testimonios
   en home).
2. **Spec + Tasks** — del incremento elegido, con delta spec sobre este PRD.
3. **Apply + Verify** — TDD estricto (vitest + Playwright), work-unit commits, archive del cambio.

## 8. Presupuesto líneas/tokens

- **N/A** para este documento: PRD descriptivo del producto existente, no requiere código.
- Cada cambio SDD nacido de este PRD define su presupuesto al proponer (heurística de flota: ~400
  líneas/PR, work-unit commits).
