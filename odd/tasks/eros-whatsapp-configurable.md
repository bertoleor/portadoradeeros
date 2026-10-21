# ODD Feature — eros-whatsapp-configurable

> **Búsqueda:** keywords:
> `whatsapp, wa.me, resolver, fallback, hardcodeo, settings, env, single-source-of-truth, ORN-180` ·
> clasificación: `odd-feature` · estado: completado · actualizado: 2026-10-17

## Objective

Una única fuente de verdad para el link de WhatsApp: precedence **settings → env → literal**,
resuelta en `src/lib/socials.ts` (`resolveWhatsAppUrl`) + canal de soporte separado
(`SUPPORT_WHATSAPP_URL`). Cero literales `wa.me/54` en componentes/pages.

## Problem / Why

Ticket kanban t_33b2671c (ex ORN-180 de Linear): el número del negocio `https://wa.me/5491138854297`
estaba hardcodeado ×4 (Navbar.tsx:49 fallback + render `|| '#'`, Footer.tsx:26 y :52,
contacto/page.tsx:38 y :83) y el dashboard admin usaba un número DISTINTO e inconsistente
(`https://wa.me/5491173643504`, admin/page.tsx:464). La infra de settings ya existía
(`admin_settings.whatsapp_url` + UI `/admin/configuracion` + API cacheada); el problema eran los
fallbacks duplicados que pisaban/ignoraban la configuración.

## Scope

- In: `src/lib/socials.ts` (`resolveWhatsAppUrl` + `SUPPORT_WHATSAPP_URL`) con tests en
  `src/lib/socials.test.ts`; wiring Navbar, Footer, contacto, servicios/[slug], admin (Soporte);
  `.env.example` (solo NOMBRES, convención del archivo); este doc.
- Out (D5 del ticket): esquema DB / API settings (ya existe) · wirear `buildWhatsAppLink` (sin call
  sites, queda para prefilled messages) · defaults de instagram/tiktok (mismo bug class, ticket
  aparte) · `src/lib/email-templates/turno-confirmado.html` (existe en main:217,269 pero la rama
  `feat/eros-email-hardening` lo ELIMINA — no resucitar, se muere solo al mergear).

## Constraints

- TDD estricto (RED→GREEN), runner vitest `environment: 'node'`, budget 3 iteraciones.
- Env se lee a module scope (`SUPPORT_WHATSAPP_URL`) y en call time (resolver) → tests con
  `vi.stubEnv` + `vi.resetModules` + import dinámico por caso.
- Base = `main`, worktree aislado (hotspot: la rama email-hardening edita el form de contacto en el
  árbol vivo). Branch `fix/orn-180-whatsapp-configurable`.
- Sin PR ni merge: review del owner primero.

## Tasks (stable IDs)

- [x] T1: RED — `src/lib/socials.test.ts` (8 tests: precedence settings-gana/env/literal, trim de
      settings y de env, whitespace-only = ausente, SUPPORT default y env-override). RED confirmado
      2026-10-17: 8/8 failed (`expected undefined to be …`).
- [x] T2: GREEN — `resolveWhatsAppUrl` + `SUPPORT_WHATSAPP_URL` en socials.ts → 8/8 green.
- [x] T3: wiring — Navbar (initial state resuelto desde el primer render, muere el `|| '#'`), Footer
      (initial + fetch), contacto (array estático + fetch), servicios/[slug] (pill vía
      `whatsappUrl`, default consistente en todas las superficies), admin Soporte
      (`SUPPORT_WHATSAPP_URL`).
- [x] T4: `.env.example` — SOLO los nombres `NEXT_PUBLIC_WHATSAPP_URL` y
      `NEXT_PUBLIC_SUPPORT_WHATSAPP_URL` con 1 línea de comentario cada uno.
- [x] T5: verificaciones 1-6 del ticket + work-unit commit.

## Accumulated evidence (2026-10-17, run 1363)

- RED: `npx vitest run src/lib/socials.test.ts` → `Tests 8 failed (8)`.
- V1: `npx vitest run src/lib/socials.test.ts src/lib/whatsapp.test.ts` →
  `2 passed (2) / 13 passed (13)` EXIT 0.
- V2: `npm run typecheck` (tsc --noEmit) → EXIT 0.
- V3: `npx eslint <7 archivos tocados>` → 0 errors (4 warnings `detect-object-injection`
  preexistentes en líneas no tocadas de admin/contacto). `npm run lint` full → 2 errors
  PREEXISTENTES de main, archivos fuera de este diff (`CustomTimePicker.tsx:69`,
  `admin/clientes/[id]/page.tsx:104`) → tarjeta de follow-up, no de este ticket.
- V4: `npx prettier --check <7 archivos tocados>` → `All matched files use Prettier code style!`
  EXIT 0.
- V5: `git grep -n "wa\.me/54" -- src` → solo `src/lib/socials.ts:19` (negocio) y `:42` (soporte)
  - fixtures de `src/lib/whatsapp.test.ts` + `email-templates/turno-confirmado.html:217,269` (out of
    scope D5). Cero literales en componentes/pages.
- V6: `git diff --stat main` → 8 archivos (7 código + este doc) ≤ 10.

## Accepted changes and rationale

- La resolver aplica trim a settings Y a env: un valor whitespace-only = ausente en cualquier nivel.
  Evita URLs con espacios que producen links rotos.
- Navbar inicializa su state con la resolver: el link de WhatsApp es real desde el primer render
  (SSR incluido); el `|| '#'` (link muerto) desaparece. Instagram/TikTok conservan sus literales por
  ahora (bug class aparte, out of scope).
- servicios/[slug] pasa por la resolver: el default del negocio aparece como pill incluso sin
  settings (antes solo renderizaba con settings seteado) — consistencia entre superficies.
- `SUPPORT_WHATSAPP_URL`: semántica distinta (soporte del dashboard, no el número del negocio),
  nunca sale de settings, solo env, default = valor actual → comportamiento preservado.
- Initial states de Footer/contacto (module scope) llaman a la resolver sin args → en client,
  `NEXT_PUBLIC_*` está inlinéado en build, sin riesgo de hidratación.

## Next step

None — feature completo. Review del owner antes de PR/merge a main.

## Progress

- 2026-10-17 (run 1363): base del worktree corregida `1e51f9e` → `main` (`1be7560`) — el kernel la
  había creado sobre el tip de `feat/eros-email-hardening`; branch a
  `fix/orn-180-whatsapp-configurable` per contrato de entrega.
- 2026-10-17: T1 RED 8/8 → T2 GREEN 8/8 → T3+T4 wiring → T5 verificaciones 1-6 verdes → work-unit
  commit.
