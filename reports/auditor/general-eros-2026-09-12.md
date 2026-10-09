# Auditoría General EROS — Modo A (UNVERIFIED)

- **Fecha:** 2026-09-12 | **Proyecto:** portadora-eros (`E:/sitios web E/jacque/portadora-eros`)
- **Régimen:** nocturna, SIN notificación. No se borró ningún archivo. Todo hallazgo = UNVERIFIED
  hasta aprobación humana.
- **Método:** baseline 10 lentes (estático, ripgrep + lectura dirigida). `tsc`/`eslint`/`vitest`
  full NO ejecutados (timeout >300s en este host); se verificó config + código fuente.
- **Stack:** Next.js 16.1.6, React 19.2.3, TS strict, Tailwind v4, Supabase SSR, Zod 4, Vitest 3,
  sin gateway de pagos (transferencia manual).

> ⚠️ **Corrección 2026-09-30 (EROS-D4):** donde este reporte dice "schema con policies" o "policies
> en `supabase_schema.sql`", describe el estado de 2026-09-12. Desde 2026-09-13 ese archivo es
> LEGACY: las policies vivas están en `migrations/migration_security_rls_allowlist.sql` (+
> `migrations/add_rls_phase10.sql`) y el schema en `migrations/0001_canonical_schema.sql` (8 tablas,
> incluye `clients` y `contact_messages`). Linaje: `migrations/README.md`.

## Baseline 10 lentes

| #   | Lente                       | Veredicto                 | Evidencia                                                                                                                                                                                                                                                                                                                               |
| --- | --------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1  | Estructura/rutas            | ✅ SANO                   | 104 archivos en `src/`; rutas públicas (/, servicios, sobre-mi, contacto, legales) + `/admin/*` + 3 API routes (`appointments`, `contact`, `push/subscribe`); `loading`/`error`/`not-found`/`global-error` presentes; PWA (`manifest.json`, `sw.js`, `PWAHandler`)                                                                      |
| L2  | Deps/stack                  | ✅ SANO (menor pendiente) | `package.json` coherente; `optimizePackageImports` (lucide, date-fns); imágenes AVIF/WebP + remotePattern Supabase storage. Minor-update stack NO ejecutado (requiere `npm outdated`/install → red + tiempo; queda propuesto en gaps)                                                                                                   |
| L3  | TS/ESLint                   | ✅ SANO                   | `strict:true`, `no-explicit-any:error`; búsqueda `as any`/`: any` = 0 resultados; `no-console` (solo warn/error); 3 `eslint-disable` puntuales y justificables (2 exhaustive-deps, 1 no-img-element en ImageUploader)                                                                                                                   |
| L4  | Tests                       | ⚠️ DÉBIL                  | 1 solo test (`src/lib/api/error.test.ts`, contrato de errores); config Vitest solo lógica node, sin jsdom/componentes; sin e2e activos (playwright declarado, sin carpeta tests)                                                                                                                                                        |
| L5  | Seguridad auth/RLS/secretos | ✅ SANO (estático)        | `proxy.ts` renueva sesión + redirige `/admin` sin user; `requireAdmin()` verifica `getUser()` + RPC `is_admin()` (allowlist `admin_users`, mismo predicado que RLS — sin drift); schema con policies por tabla + storage; `.env.example` documenta signup público OFF y service-role server-only; `sanitize-html` allowlist en bio (S5) |
| L6  | API/abuse                   | ⚠️ GAP                    | `appointments` y `contact` con Zod ✅ pero **sin rate-limit, captcha ni honeypot**; `contact` persiste en `contact_messages` y solo `console.error` si falla el insert (silencioso para el caller)                                                                                                                                      |
| L7  | SEO/PWA                     | ✅ SANO                   | `sitemap.ts`, `robots.ts`, OG/Twitter `es_AR`, manifest; keywords esotéricas coherentes                                                                                                                                                                                                                                                 |
| L8  | A11y                        | ⚠️ MENOR                  | `viewport` con `maximumScale: 1` + `userScalable: true` contradictorios (iOS: bloquea pinch-zoom → WCAG 1.4.4). Resto estándar shadcn/Radix                                                                                                                                                                                             |
| L9  | i18n/contenido              | ✅ SANO                   | `es-AR` consistente (fechas `es-AR`, copy rioplatense en errores admin); sin framework i18n (correcto: sitio monolingüe)                                                                                                                                                                                                                |
| L10 | Docs/legal/deuda            | ⚠️ GAP                    | README de 1 línea, sin CHANGELOG ni ADRs (generados ahora: `CHANGELOG.md`, `docs/adr/0001`); legales presentes (privacidad, términos, cancelación); deuda histórica en `AUDITORIA_*.md`/`PLAN_*.md` sueltos en raíz (NO tocados)                                                                                                        |

## Por rol (clave)

- **Visitante/cliente:** puede ver servicios, reservar (email vía `sendAppointmentConfirmation` +
  notificación admin), contactar. Riesgo: spam en formularios (L6). Pago por transferencia manual
  (`bankDetails`) — fuera de alcance PCI.
- **Admin:** login Supabase → dashboard (calendario, clientes, mensajes, servicios, configuración).
  Gate doble: `proxy.ts` + `requireAdmin()` por acción server. ✅
- **Sistema:** email (Resend/EmailJS), push (`web-push` subscribe route), Supabase SSR. Secrets
  server-only documentados. ✅

## Gate bloqueante pagos/auth/RLS/deploy — PASS estático

- **Pagos:** sin gateway online → sin superficie PCI. Transferencia manual verificada en schema del
  form. 🟢
- **Auth:** proxy + `is_admin()` RPC allowlist. 🟢 (estático; verificación viva contra DB =
  pendiente humano)
- **RLS:** policies en `supabase_schema.sql` (servicios, appointments, admin_settings, storage).
  `migration_phase10.sql` sin policies nuevas (0 matches) — revisar que no abra tablas sin policy.
  🟡
- **Deploy:** Next 16 + `reactCompiler:true`; sin `vercel.json` custom visto; build real no
  ejecutado (timeout host). 🟡

## Micro-fixes propuestos (NO aplicados — UNVERIFIED, requieren ok)

1. `layout.tsx` viewport: quitar `maximumScale: 1` (a11y). 2. `contact/route.ts`: log estructurado +
   alerta si falla insert. 3. Rate-limit básico en `appointments`/`contact` (p.ej. 5/min por IP). 4.
   `npm outdated` + minor updates. 5. Tests para `sanitizeBioContent` y schemas Zod.

## Skills (ampliación OOB)

- `safe-install.sh` existe en `E:/Hermes/scripts/`. **No se instaló ningún skill:** no hay lista
  definida de skills faltantes y adivinar IDs implica red + efectos laterales → requiere ok humano
  con IDs explícitos. Reglas registradas: CAUTION solo con `--force`, DANGEROUS nunca,
  `afip-facturación` nunca sin ok.

## No-técnico (09/10/19/21/18/15/23)

Generado: `CHANGELOG.md` (19-writer), `docs/adr/0001-admin-allowlist-is-admin.md` (19-writer/ADR).
Contenido (21), i18n (18), a11y (15), legal (23), producto (09), UI/UX (10): evaluados en L7–L10,
sin faltantes bloqueantes salvo CHANGELOG/ADRs ya creados.

## audit_to_kanban — DRY-RUN

Sin script `audit_to_kanban` en repo ni Hermes (ver `eros-gaps.md` §Kanban). Simulación: 2×A / 4×B /
3×C listos para importar. Ningún item movido — dry-run puro.
