# Security Policy — EROS (portadora-eros)

> **Búsqueda:** keywords:
> `eros, seguridad, security policy, rls, rate limit, honeypot, supabase auth` · clasificación:
> `seguridad` · estado: `canónico` · actualizado: 2026-09-30 Relacionados:
> [[projects/eros/README|README]] · [[03-stack]] · [[F0-2026-09-27]] ·
> [[adr/0001-admin-allowlist-is-admin]]

## Supported Versions

| Version | Supported |
| ------- | --------- |
| main    | ✅        |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, email **bertoleor@github.com** (or open a private security advisory on GitHub).

We will acknowledge receipt within 48 hours and provide a timeline for fix within 5 business days.

## Security Measures Implemented (verificado contra `src/` — 2026-09-30)

- **Authentication**: Supabase Auth + RLS (canónico:
  `migrations/migration_security_rls_allowlist.sql` + `migrations/add_rls_phase10.sql`; linaje
  completo en `migrations/README.md`).
- **Authorization (admin)**: gate doble — `src/proxy.ts` + `requireAdmin()`
  (`src/lib/auth/requireAdmin.ts`) con allowlist vía función SQL `is_admin()` → ADR-0001.
- **Anti-spam**: rate-limit sliding-window in-memory por IP+form (`src/lib/spam-protection.ts`, 5
  req/60s) + honeypot `company_website` en formularios públicos (`ServiceContactForm`, `/contacto`).
- **Pagos**: **sin gateway** — reserva + transferencia bancaria manual (sin superficie PCI). El
  único rastro de MercadoPago en `src/` es un placeholder de texto en
  `src/app/admin/configuracion/banco/page.tsx:132`.
- **Validación**: Zod 4 en los bordes de entrada (server actions y routes) + react-hook-form en
  client; TypeScript strict.
- **Secretos**: sin hardcoded secrets (gitleaks PASS en pre-commit,
  `reports/gate-sec-gitleaks-2026-09-26.json`); `.env*` ignorado por git (`.gitignore`).
- **Pre-commit**: gitleaks (`--staged --redact --exit-code 1`) + lint-staged (eslint+prettier) + gga
  secret-scan (`scripts` husky).

## Medidas NO implementadas (aspiracionales en la versión 2026-09-15 de este doc — no creerlas)

El SECURITY.md previo listaba medidas que **no existen en el código**. Estado real 2026-09-30:

- **RBAC multi-rol** (super_admin > admin > editor > viewer): no existe — es allowlist binaria vía
  `is_admin()`.
- **CSP con nonce por request**: no implementada (sin `headers()` en `next.config.ts`).
- **Cookies custom** HttpOnly/SameSite: no implementadas (la sesión la maneja Supabase).
- **HSTS / X-Frame-Options / nosniff**: no seteados en `next.config.ts` ni `vercel.json`.
- **Zod-validated env at boot**: no existe (`process.env.NEXT_PUBLIC_SUPABASE_URL!` con non-null
  assertion en `src/lib/supabase/server.ts:8`).
- **Webhooks con HMAC + idempotencia + DLQ**: no hay webhooks.
- **security_logs con retention**: no existe tal tabla en el schema.
- **Dependabot**: no configurado (`.github/` solo tiene el workflow de CI).

## Security Contacts

- Primary: @bertoleor
