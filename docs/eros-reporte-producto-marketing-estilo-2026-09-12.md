# EROS — Reporte Producto / Marketing / Estilo

> Origen: `plan.md`, `package.json`, `AUDITORIA_*` (2024/2026/estética), `docs/`, `plans/`, `reports/` (auditor + project-analysis). Nada aplicado, nada borrado. UNVERIFIED. Español rioplatense. Provider nvidia.

**Fecha:** 2026-09-12 · **Stack:** Next 16.1.6 / React 19.2.3 / TS strict / Tailwind v4 / Supabase SSR / Zod 4 / React Compiler · **Repo:** `E:/sitios web E/jacque/portadora-eros` (branch `feat/security-audit-remediation`)

---

## 1. Producto

### Qué es
Sitio monolingüe **es-AR de servicios esotéricos** (tarot, búzios, limpieza energética, velomancia) con panel admin. Modelo: **reserva de turno + pago por transferencia manual** (sin gateway online, sin superficie PCI). Un solo operador (Jacque). Publicado como PWA.

### Servicios (catálogo)
- Tarot
- Búzios
- Limpieza Energética
- Velomancia

Cada uno con página de detalle (`/servicios/[slug]`), imagen, descripción y CTA "Agendar".

### Actores + superficie
| Rol | Capacidad | Cómo |
|-----|-----------|------|
| Visitante | Ve servicios, reserva turno, contacta | `POST /api/appointments`, `POST /api/contact` |
| Cliente | Recibe confirmación email + datos bancarios | EmailJS (6 plantillas) |
| Admin | Gestiona calendario/clientes/mensajes/servicios/config | Supabase Auth + gate doble (`proxy.ts` + `requireAdmin()` + RPC `is_admin()` allowlist) |
| Sistema | Email, push (web-push), storage, SSR | Supabase SSR, secrets server-only |

### Rutas
- **Públicas:** `/`, `/servicios`, `/servicios/[slug]`, `/sobre-mi`, `/contacto`, `/politica-cancelacion`, `/privacidad`, `/terminos`.
- **Admin:** `/admin/*` → dashboard/redirige a servicios, calendario, clientes, mensajes, configuración (perfil, banco, horarios, seguridad, PWA, redes).

### Flujo de valor central (reserva + pago)
1. Cliente elige servicio → formulario multi-paso (datos → fecha/hora → instrucciones de transferencia).
2. Validación Zod → email confirmación al cliente + notificación al admin.
3. Persistencia vía server action `createAppointment()` (insert en `appointments` + `sendPushToAdmins`).
4. Pago: transferencia manual. `bankDetails` (titular/cbu/alias) desde `admin_settings`, mostrado en paso final.

> **⚠ Riesgo conocido (G1-P1):** doble camino de reserva — el API route `POST /api/appointments` es email-only **sin persistencia y sin rate-limit**, mientras la server action sí inserta en DB. El formulario cliente (`ServiceContactForm`) usa la server action; el route queda como superficie paralela → drift.

### Estado de funcionalidades (síntesis auditoría 2024→2026)
- ✅ Turnos: reserva, confirmación, bloqueo de horarios, validación de colisiones, vistas mes/semana/día.
- ✅ Email: confirmación pendiente/confirmado, notificación admin, recordatorio, cancelación, contacto.
- ✅ Admin: CRUD servicios, clientes, mensajes, config (banco/horarios/redes), login/logout.
- ⚠️ Parcial: push (VAPID), imágenes de servicios (ImageUploader no conectado), redes solo IG/WhatsApp/TikTok (FB/Twitter/YT en types sin UI).
- ❌ No implementado: completar/cancelar turno desde admin, Google Calendar sync, "Sobre Mí" dinámico, chat/live, blog, testimonios.

### Deuda / gaps de producto (triaje A/B/C + G1)
- **A1** — sin rate-limit en `appointments`/`contact` (abuso abierto).
- **A2** — `migration_phase10.sql` sin policies nuevas (riesgo RLS).
- **G1-P1** — doble camino reserva (arriba).
- **G1-P4** — tablas referenciadas en código (`contact_messages`, `push_subscriptions`, `admin_users`) no siempre definidas en schema canónico.
- **B/C** — tests mínimos, honeypot pendiente, `contact` silencia fallo de insert, `maximumScale:1` (a11y), deuda histórica de `.md` sueltos en raíz.

---

## 2. Marketing

### Posicionamiento declarado (plan.md original)
- Marca: **"Portadora de Eros"** — servicios de conexión y lectura espiritual.
- Eslogan/CTA en hero + carrusel de servicios como puerta de entrada.
- Canales sociales configurados: **Instagram, WhatsApp, TikTok** (WhatsApp como canal directo de conversión).
- **SEO/PWA** ya activos: `sitemap.ts`, `robots.ts`, OpenGraph/Twitter `es_AR`, `manifest.json`, keywords esotéricas coherentes, JSON-LD declarado en plan.

### Radar / oportunidades detectadas (no resueltas)
- **Conversión:** el único embudo monetizable es la reserva + transferencia manual; no hay gateway online (decisión consciente, sin PCI) pero sí fricción de pago.
- **Redes incompletas:** FB/Twitter/YouTube definidos en types pero sin campos en admin → no publicables sin dev.
- **Contenido:** sin blog/articulos/testimonios (baja prioridad, pero es la vía natural de autoridad/SEO para un nicho esotérico).
- **SEO por servicio:** metadata dinámica por servicio individual pendiente (hoy genérica por página).

### Recomendaciones marketing (UNVERIFIED, requieren ok)
1. Cerrar el embudo de pago: evaluar enlace de pago (Mercado Pago/MODO) **sin** tokenizar tarjeta en el sitio (mantiene "sin PCI", reduce fricción).
2. Completar redes faltantes en admin si hay perfiles activos.
3. Metadata + schema.org por servicio/esquema de `LocalBusiness` para búsqueda local.
4. Habilitar testimonios/blog como contenido de autoridad a mediano plazo.

---

## 3. Estilo / identidad visual

### Evolución del design system (dos iteraciones documentadas)

| Aspecto | plan.md (v1 original) | Estado real actual (auditorías) |
|---------|----------------------|---------------------------------|
| Paleta | Burgundy `#800020` + dark gold `#B8860B` | Adoptó rojo `#D11019`/`#F01A24`/`#9A0710` + surface casi negro `#0a0505` (auditoría estética) |
| Identidad | "no AI aesthetics, solid colors" | Viró a **glassmorphism + fondo mesh/aurora pastel** |
| Tipografía | sans única, hero 4rem+ | Playfair Display + Geist (Next/font) |

> ⚠️ **Drift de dirección**: el plan original pedía burgundy/dark-gold sólido "sin estética AI"; el proyecto real terminó en un **tema oscuro + rojo vibrante + background mesh animado pastel (glassmorphism)**. Queda pendiente validar cuál es la dirección canónica con Jacque.

### Estado estético real (auditoría estética, 14 críticos)
Problemas que generan "sitio apretado / sin aire / baja calidad":
- **Anchos de contenedor inconsistentes**: 896px (hero), 1152px (`max-w-6xl`), 1200px (`section-container`) conviven.
- **Padding horizontal hardcodeado** (`px-6/8/12`) en vez de `px-[5%]`.
- **Navbar inestable**: cambia `py-10`→`py-6` al hacer scroll (salto visual).
- **Botones/cards inconsistentes**: radius 20px vs 24px, sin `rounded-full` (50px) en CTAs.
- **Cards**: borde `white/10` casi invisible, hack `-mx-8` que rompe padding interno.
- **Foto "Sobre Mí" no redonda** (rectangular `aspect-[4/5]`), página descentrada.
- **Formulario contacto pequeño** (`col-span-7` ≈ 58%) y pegado a bordes.
- **Footer apretado** (poco espacio superior).
- **Tipografía con pesos inconsistentes** (h1/h2 light vs h3 semibold).

### Sistema objetivo propuesto (auditoría estética, no aplicado)
- **Contenedor**: `.container-premium = max-w-[1200px] mx-auto px-[5%]`.
- **Espaciado**: `py-[100px]` secciones, `p-[30px]` cards, `gap-6`.
- **Bordes unificados**: `white/5` (subtle), `white/10` (default), `white/20` (visible).
- **Radius**: botón `rounded-full`, card `24px`, input `16px`.
- **Botones**: una sola clase `.btn-premium` (padding 12px/24px, weight 300).
- **Navbar**: altura fija 80px, glass permanente, transición de fondo (no de tamaño).
- **Componentes reutilizables**: `<Button variants>`, `<PremiumCard>`, `<Section>`, `<Container>`, `<Input>`, `<IconButton>`.

### Rendimiento / mobile (planes existentes)
- `BackgroundMesh.tsx` optimizado (FPS adaptativo, pausa con `visibilitychange`, `prefers-reduced-motion`, 50% menos partículas en móvil).
- Next/image: AVIF/WebP, deviceSizes, `minimumCacheTTL` 30d, blur placeholders, lazy loading.
- Botones con área táctil mínima 44×44px; calendario touch-optimized.
- Basado en auditoría responsive (0 críticos, 8 moderados, 4 menores).

---

## 4. Estado de calidad (para contexto)

| Área | Veredicto | Nota |
|------|-----------|------|
| TS / ESLint | ✅ | `tsc --noEmit` PASS, `strict`, `no-explicit-any` |
| Prettier | ⚠️ ROTO | `.prettierrc.json` apunta a `tailwind.config.ts` inexistente (Tailwind v4 no usa config) → EROS-B5 |
| Tests | ⚠️ Mínimo | 1 archivo (`error.test.ts`), sin e2e activos |
| Pagos | 🟢 | transferencia manual, sin PCI |
| Auth / RLS | 🟢/🟡 | allowlist `is_admin()` estático OK; `migration_phase10` salvedad (A2) |
| Baseline precommit | 🟢 | husky + prettier + gga (secret-scan) |

---

## 5. Cierre

Reporte consolidado desde documentación existente; **ningún cambio aplicado, nada borrado**. Pendientes humanos: validar dirección de estilo canónica (burgundy sólido vs dark+rojo+mesh), verificación viva de auth/RLS contra DB, y aprobación de los triaje A/B/C + G1 para importar a kanban real.