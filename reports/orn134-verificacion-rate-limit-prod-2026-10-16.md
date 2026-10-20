# ORN-134 — Verificación rate-limit 429 en prod con curl — 2026-10-16

> **Búsqueda:** keywords:
> `rate-limit, 429, curl, ORN-134, spam-protection, portadoradeeros, vercel, appointments, contact`
> · clasificación: `verificación` · estado: canónico · actualizado: 2026-10-20 (re-verificación
> viva + cierre de card)

- **Fecha:** 2026-10-16 ~14:25 ART · **Autor:** 24-orquestador (t_db637957) · **Motivo:** cerrar
  ORN-134 — verificación pendiente desde `reports/cron-runs/g0-eros-2026-09-29.md` ("curl rate-limit
  429 contra prod → requiere target prod autorizado").

## Resumen

**VERIFICADO.** El rate-limit (sliding window 5 req/min por IP+scope, `src/lib/spam-protection.ts`)
funciona en producción contra el deploy de `origin/main` (1be7560, vercel):

1. `POST /api/contact` → 5×HTTP 400, luego **HTTP 429** (6º y 7º) con
   `{"error":"Demasiados envíos. Intenta nuevamente en unos minutos."}`. Tras 65s vuelve 400 →
   ventana deslizante de 60s, **no** es ban permanente.
2. `POST /api/appointments` → **HTTP 404** (página 404 del sitio). La ruta fue removida en ORN-75
   (commit 7a7f0b4 "remove orphan email-only booking route") — el booking va por el camino canónico
   único: server action `createAppointment()` con
   `checkRateLimit('appointments', ip, SPAM_RATE_LIMIT)` en `src/lib/api/appointments.ts:225`,
   cubierto por tests.

**Target:** `https://portadoradeeros.vercel.app` (prod). Payload de prueba `{}` — inválido DESPUÉS
del check de rate-limit (orden del route: honeypot → rate-limit → validación), por lo tanto **cero
side-effects**: no se envió email ni se insertó nada en `contact_messages`.

## Receipts

### curl contra prod (2026-10-16, transcript)

```
TEST 1: POST /api/appointments → HTTP 404 (ruta removida ORN-75)

TEST 2: POST /api/contact x7, body {} (Content-Type: application/json)
req 1: HTTP 400  {"error":"Faltan campos requeridos"}
req 2: HTTP 400  {"error":"Faltan campos requeridos"}
req 3: HTTP 400  {"error":"Faltan campos requeridos"}
req 4: HTTP 400  {"error":"Faltan campos requeridos"}
req 5: HTTP 400  {"error":"Faltan campos requeridos"}
req 6: HTTP 429  {"error":"Demasiados envíos. Intenta nuevamente en unos minutos."}
req 7: HTTP 429  {"error":"Demasiados envíos. Intenta nuevamente en unos minutos."}

sleep 65 → POST /api/contact → HTTP 400 {"error":"Faltan campos requeridos"}
  (ventana de 60s expiró: el limiter desliza, no banea)
```

### Tests unitarios (branch feat/eros-email-hardening, 2026-10-16 14:27)

```
npx vitest run src/lib/spam-protection.test.ts src/app/api/contact/route.test.ts src/lib/api/appointments.test.ts
Test Files  3 passed (3)
     Tests  43 passed (43)
```

Cubre: limiter (`spam-protection.test.ts`), route de contact con rate-limit neutralizado en tests de
handler (`route.test.ts`), y server action de appointments con buckets frescos por test
(`appointments.test.ts:183`).

### Estado del código deployado

- `origin/main` contiene 7220931 (feat: spam protection) — verificado con
  `git merge-base --is-ancestor`.
- `origin/main` NO tiene `src/app/api/appointments/` (solo `contact`, `admin/push/subscribe`,
  `cron/reminders`).
- Config: `SPAM_RATE_LIMIT = { max: 5, windowMs: 60000 }`, scopes separados `contact` /
  `appointments` (`src/lib/spam-protection.ts:145`).

## Hallazgo secundario (nuevo): dominio custom NXDOMAIN

Durante la verificación: `portadoradeeros.com` **no resuelve** —
`nslookup portadoradeeros.com 8.8.8.8` → `Non-existent domain`. El sitio en prod publica ese dominio
como canónico en `og:url`/metadata (hardcode en layout; ver `docs/04-branding.md:36-39`, que además
ya registraba la inconsistencia sitemap/robots → `portadoreros.com`). Prod solo vive en
`portadoradeeros.vercel.app` (`.env.local`:
`NEXT_PUBLIC_APP_URL=https://portadoradeeros.vercel.app`).

Impacto: quien usa el dominio de marca no llega al sitio; SEO/OG apuntan a un dominio muerto.
Requiere decisión del owner (registrar/renovar dominio vs migrar canonical al dominio vivo) → ticket
hijo creado para 12-cloud, bloqueado a la espera de esa decisión.

## Re-verificación 2026-10-20 (turno noche, cron orquestador-loop-eros)

Re-verificación viva contra prod (`https://portadoradeeros.vercel.app`), mismo método de cero
side-effects: payload `{}` = inválido DESPUÉS del rate-limit (orden del route: honeypot → rate-limit
→ validación); honeypot probado con email sintácticamente inválido (un 200 sólo puede venir del
short-circuit — no hay camino posible de email/insert). Código sin cambios desde la pasada del
10-16: el último commit que toca `src/lib/spam-protection.ts` sigue siendo 7220931.

```text
TEST A (07:31:16Z): POST /api/appointments {} → HTTP 404 (página 404 del sitio) — ruta sigue removida (origin/main sin src/app/api/appointments/route.ts)

TEST B (07:31:16Z): POST /api/contact {company_website:"http://bot-trap.example", email:"not-an-email"} → HTTP 200 {"success":true,"message":"Mensaje enviado exitosamente"}
  → 200 con email inválido = short-circuit honeypot (route.ts:35-39, antes de validación): cero writes, cero emails

TEST C (07:31:20Z): POST /api/contact x7, 7 procesos curl separados → 7×HTTP 400, SIN 429 (ver hallazgo abajo)

TEST C2 (07:34:47Z): POST /api/contact x7 encadenados en UNA conexión curl (mismo socket → misma instancia) →
  req 1-5: HTTP 400 {"error":"Faltan campos requeridos"}
  req 6:   HTTP 429 {"error":"Demasiados envíos. Intenta nuevamente en unos minutos."}
  req 7:   HTTP 429 (idem)
```

**Gate t_ver1 VERIFICADO en vivo 2026-10-20:** 429 en la 6ª request sobre /api/contact ✓ · honeypot
200 sin email ✓ · /api/appointments 404 (camino único por server action; rate-limit del booking en
`src/lib/api/appointments.ts` con tests, ver pasada 10-16) ✓.

**Hallazgo secundario (NUEVO): el rate-limit in-memory es POR INSTANCIA lambda.** TEST C (7
conexiones separadas casi simultáneas) no tripeó 429: las requests se repartieron entre instancias
serverless y ninguna vio >5. TEST C2 (misma conexión) tripeó 429 exacto en la 6ª. No es regresión —
`src/lib/spam-protection.ts` documenta el limiter in-memory como decisión cost-zero (sin Redis); es
su límite arquitectural: en serverless la ventana deslizante por IP aplica por-instancia, no global.
Un atacante con concurrencia puede superar 5 req/min por IP sin ver 429. Mitigación real
(Upstash/Redis o middleware edge con KV) = ticket de seguimiento con decisión owner (costo de
infra); NO bloquea el gate (el diseño cost-zero es el especificado en el plan Fase 1).

## Sigue

- ~~Linear ORN-134 puede marcarse **Done** con este receipt~~ → **cerrado 2026-10-20**:
  re-verificación viva OK (sección de arriba), receipt commiteado a main, card movida a review con
  evidencia (el outage del connector Linear del 10-16 quedó resuelto desde esta sesión).
- NUEVO 2026-10-20: rate-limit por-instancia (hallazgo arriba) → ticket de seguimiento creado en
  Linear; decisión owner (costo de store compartido Upstash/KV vs cost-zero actual).
- Ticket hijo dominio NXDOMAIN (ver kanban) — decisión owner.
