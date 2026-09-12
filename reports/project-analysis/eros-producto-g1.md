# EROS — Análisis Producto G1 (UNVERIFIED, dry-run)

> Origen: lectura dirigida de `src/`, `supabase_schema.sql`, `plan.md`, `docs/`, `reports/project-analysis/eros-gaps.md` y `reports/auditor/general-eros-2026-09-12.md`. Nada aplicado, nada borrado. Provider nvidia. Español rioplatense.

**Fecha:** 2026-09-12 · **Stack:** Next 16.1.6 / React 19.2.3 / TS strict / Tailwind v4 / Supabase SSR / Zod 4 · **Repo:** `E:/sitios web E/jacque/portadora-eros` (branch `feat/security-audit-remediation`)

---

## 1. Qué es el producto

Sitio monolingüe es-AR de **servicios esotéricos** (tarot, búzios, limpieza energética, velomancia) con panel admin. Modelo de negocio: **reserva de turno + pago por transferencia manual** (sin gateway online). Un solo operador (Jacque).

**Actores:**
| Rol | Capacidad | Cómo |
|-----|-----------|------|
| Visitante | Ve servicios, reserva turno, contacta | `POST /api/appointments`, `POST /api/contact` |
| Cliente | Recibe confirmación por email + datos bancarios | Resend/EmailJS |
| Admin | Gestiona calendario/clientes/mensajes/servicios/config | Supabase Auth + gate doble |
| Sistema | Email, push (web-push), Supabase SSR | secrets server-only |

**Rutas públicas:** `/`, `/servicios`, `/servicios/[slug]`, `/sobre-mi`, `/contacto`, `/politica-cancelacion`, `/privacidad`, `/terminos`.
**Rutas admin:** `/admin/*` (login, dashboard→servicios, calendario, clientes, mensajes, configuracion).

---

## 2. Flujo de valor central (reserva + pago)

1. Cliente elige servicio → formulario 2 pasos (datos + fecha/hora, luego instrucciones de transferencia).
2. `POST /api/appointments` valida con Zod → envía email confirmación al cliente + notificación al admin.
3. **NO persiste el turno en DB** (comentado: *"Future integration: Save to database when configured"*). El camino real de persistencia es la server action `createAppointment()` en `src/lib/api/appointments.ts` (inserta en `appointments` + `sendPushToAdmins`).
4. Pago: transferencia manual. `bankDetails` (owner/name/cbu/alias) vive en `admin_settings` y se muestra en el paso final. Sin superficie PCI.

> **⚠️ Hallazgo G1**: existe **doble camino de reserva** — el API route (`route.ts`) email-only sin DB, y la server action (`appointments.ts`) que sí inserta. El formulario cliente (`ServiceContactForm.tsx`) llama a la server action. El API route queda como superficie paralela **sin persistencia y sin rate-limit** (gap EROS-A1 ya registrado). Riesgo de drift entre ambos caminos.

---

## 3. Pagos / Auth / RLS (producción primero)

### Pagos — SIN gateway (transferencia manual)
- `bankDetails` en `admin_settings` (editable en `/admin/configuracion/banco`).
- Hardcode default en `src/lib/api/appointments.ts` (`'Jacqueline'`, `'Mercado Pago'`, `'No configurado'`) como fallback si no hay settings.
- `POST /api/appointments` recibe `bankDetails` desde el cliente (echo del paso 2) → **el cliente manda los datos bancarios**, no el server. Riesgo de manipulación del body (aunque solo alimenta el email de confirmación; la server action real usa `getAdminSettings()` server-side).
- **Gap**: email de confirmación usa `bankDetails` del request (cliente) en `route.ts` (línea 57), mientras la server action usa los reales de DB. Coherencia débil en el camino email-only.

### Auth — allowlist `is_admin()`
- `proxy.ts` renueva sesión + redirige `/admin` sin user.
- `requireAdmin()` server-side: `getUser()` + RPC `is_admin()` (tabla `admin_users`).
- Mismo predicado en RLS y en app (ADR-0001) → sin drift. 🟢 estático.
- **Pendiente humano**: verificación viva contra DB no ejecutada (sin credenciales en esta sesión).

### RLS — policies presentes, con salvedades
- `supabase_schema.sql` define policies para `services`, `appointments`, `admin_settings`, `storage.objects`.
- `appointments` INSERT con `WITH CHECK (true)` → cualquiera puede insertar turno (intencional: reserva pública), pero **sin defensa anti-spam a nivel DB**.
- **Gap EROS-A2**: `migration_phase10.sql` solo agrega columna `business_hours` (0 `CREATE POLICY`). No abre tablas nuevas, pero si en el futuro crea/expande tablas sin policy quedarían expuestas. Suelo estable visto: lista de `CREATE TABLE` en schema no incluye `contact_messages`, `push_subscriptions`, `admin_users`, `profiles` — **estas tablas se referencian en código pero no están definidas en `supabase_schema.sql`** (probablemente en `migrations/`, sin auditar).

---

## 4. Matriz de riesgos producto (G1)

| ID | Riesgo | Prob | Impacto | Producción-blocker |
|----|--------|------|---------|--------------------|
| G1-P1 | Doble camino de reserva (API email-only vs server action DB) → drift | Alta | Medio | 🟡 Sí |
| G1-P2 | `bankDetails` desde request cliente en email confirmation | Media | Medio (solo email) | 🟢 No PCI |
| G1-P3 | INSERT público en `appointments` sin anti-spam DB | Alta | Bajo-medio | 🟡 (con EROS-A1) |
| G1-P4 | Tablas en código sin definir en schema canónico (`contact_messages`, `push_subscriptions`, `admin_users`) | Media | Alto (drift schema) | 🔴 Verificar |
| G1-P5 | `SECURITY.md` declara MercadoPago/Upstash/CSP/HMAC que **no existen en código** | — | Reputacional | 🟢 doc (corregir o marcar aspiracional) |

---

## 5. Recomendaciones (UNVERIFIED, requieren ok)

1. **Unificar camino de reserva**: decidir si `POST /api/appointments` cae a deprecado o delega en `createAppointment()` (server action). Hoy son dos implementaciones divergentes.
2. **Mover `bankDetails` a server-only** en el email: `route.ts` debería leer `getAdminSettings()`, no el body del cliente.
3. **Auditar `migrations/`** contra `supabase_schema.sql` para confirmar dónde viven `contact_messages`, `push_subscriptions`, `admin_users` (G1-P4).
4. **Corregir `SECURITY.md`**: marcar las medidas no implementadas como "planificadas" o removerlas (anti-drift documental).
5. Rate-limit + honeypot en ambos formularios públicos (ya en EROS-A1/B2 del triaje).

## Kanban (dry-run)

Columnas sugeridas: `G1 ← P1, P4 | P2, P3 | P5`. Este archivo ES el payload de importación; ningún item movido. Destino real requiere dato humano + sesión principal (subagentes no mutan kanban).