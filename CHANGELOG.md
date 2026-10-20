# Changelog — portadora-eros

> **Búsqueda:** keywords: `changelog, changesets, unreleased, security, booking, a11y, ci` ·
> clasificación: `changelog` · estado: canónico · actualizado: 2026-10-20

Todos los cambios notables de este proyecto se registran en este archivo.

**Convención (changesets):** los cambios de producto se registran con `pnpm changeset` en la rama
del cambio. El workflow Release (`.github/workflows/release.yml`) consume los entries de
`.changeset/` y reescribe este archivo al publicar una versión — no editar a mano las secciones de
versión. Hasta la primera versión publicada, `[Unreleased]` funciona como backlog curado a mano
(formato Keep a Changelog simplificado).

> **Restaurado 2026-10-20** (P17-4 rec 1, changelog-weekly): este archivo fue vaciado por error el
> 2026-09-30 — `59b1578` (kickoff «docs/ única fuente») retiró `docs/CHANGELOG.md` sin volcar su
> contenido en la raíz (finding F1, revisión P17-4). El bloque 2026-09-12 se recuperó de la historia
> (`59b1578^:docs/CHANGELOG.md`) y la ventana 2026-09-25 → 2026-10-20 se curó desde main. Ubicación
> canónica: raíz (no se recrea `docs/CHANGELOG.md`).

## [Unreleased]

### Recuperado — 2026-09-12 (pre-P17)

#### Added

- Auditoría general Modo A: `reports/auditor/general-eros-2026-09-12.md` (baseline 10 lentes).
- Triaje de gaps A/B/C: `reports/project-analysis/eros-gaps.md` (dry-run kanban).
- ADR-0001: allowlist de admin vía `is_admin()` (`docs/adr/0001-admin-allowlist-is-admin.md`).

#### Noted (2026-09-12) → Landed

- Rate-limit + honeypot en `/api/appointments` y `/api/contact` (EROS-A1) — verificado en prod
  20/10: limiter 429 + honeypot 200 en vivo (receipt ORN-134, c246473).
- Revisión RLS de `migration_phase10.sql` (EROS-A2) — RLS de `admin_users` + `is_admin()`
  verificados en live DB 20/10 (receipt ORN-135, bd9960c).
- Quitar `maximumScale: 1` del viewport (EROS-C1) — aterrizado en el kickoff WCAG AA (0f4c2a0,
  02/10).

### Security

- react/react-dom 19.2.6 → 19.2.9 (a38ee49, 19/10) — GHSA-xqc2-xf4c-x3h3 (RSC RCE, Critical)
  - GHSA-h3gv-c5rc-p453 (Server Functions DoS, High), ORN-213 slice eros. Supera el bump parcial a
    19.2.6 del 18/10 (0c4eab1, CVE-2026-23870 RSC DoS).
- next 16.4.1 (44bbf7d, 17/10) — línea 16.3.x EOL, dentro del rango de CVE-2026-94545.
- next 16.4.0 + sharp 0.35.5 + vitest 4.1.11 (f4d7e93, 08/10) — EROS-DEPS-RuntimeVulns: runtime
  audit 17 vulns → 0; lockfile regenerado (52dbfb2).
- nodemailer 9.1.1 → 10.0.11 (f83120f, 29/09) — GHSA-6vj9-mwq6-2f5v.
- Upgrade general de deps: 0 HIGH/CRITICAL en ambos lockfiles (28bce67, 27/09) — ORN-196.
- contact: caps de payload H3 + trim server-side en el schema del form público (5fcd14c, 08/10).

### Fixed

- booking: guard anti-overbooking en el camino público de `createAppointment` (a31f16e, 26/09) —
  ORN-173.
- booking: timezone ART canónico en todo el flujo de disponibilidad, con red-proof test (11ce958 +
  d3d92d9, 02/10) — EROS-D1.
- email: dispatcher `EMAIL_PROVIDER` cableado a los callers; EmailJS retirado del stack vivo
  (57e7b58, 01/10; docs 475dcb0) — EROS-D2.
- push: `/push/subscribe` exige `requireAdmin` y usa `getUser` (a73734d, 01/10) — EROS-D3.
- contact: flag `dbSaved` expuesto cuando el insert falla + `logger.error` en prod (cd6026d, 01/10)
  — EROS-B3.
- observabilidad: logger warn/error emiten en producción + `tmp/` scratch resuelto (188c5d9, 01/10)
  — EROS-D5; schema legacy deprecado in-file, `citas` → canónico (d33013c) — EROS-D4.
- a11y: kickoff WCAG AA — zoom habilitado (`maximumScale` retirado), skip-link, focus visible, piso
  de contraste site-wide (0f4c2a0, 02/10).

### Added

- test: E2E booking happy path — playwright config, stub REST de Supabase, spec BOOKING-E2E-001
  (9e1209d, 28/09) — ORN-133. ⚠️ Roto en main: el fix (e4ac924) vive sin merge en
  `feat/eros-email-hardening`; ese lane registra su entrada vía `.changeset` al mergear.
- tooling: arsenal de calidad — semgrep SAST, pr-agent AI review, knip, jscpd, cspell (5cc7830 +
  lockfile bb87e32, 18-19/10).
- ci: gate design-qa que valida tokens de diseño (d5d67b8, 17/10) — ORN-206, PR #21.
- ci: Release workflow desbloqueado — `.changeset/` trackeado, Node 20 → 24, package-lock.json
  sincronizado (af63e6f + 0d740ca + cb52bb3, 19/10) — da vigencia a la convención changesets de este
  archivo.
- ci: pre-commit husky fail-closed trackeado en el repo, patrón khal (4be1c52 + 4d93411, 20/10) —
  ORN-136.
- ci: ola de endurecimiento del 08/10 — matrix cubre branches feat, npm audit estricto `--omit=dev`,
  gates Trivy con `exit-code:1`, pin trivy-action v0.36, permisos gitleaks PR, env público de
  Supabase para e2e, fix SBOM cyclonedx, lint legacy limpiado, format drift cerrado (ef08e4f,
  d40e791, 89f563a, d57450c, 6da0446, 09fb29e, cd0dbab, 1313b51, c4212da).
- docs: consolidación «docs/ única fuente» — README ampliado, retiro de 15 .md duplicados de raíz,
  links vault (9685242 + 987abd1 + 1deda4e, 26-27/09) — ORN-123.

---

> Criterio de curación: entries de cron/ops «sin tarea» y receipts puramente meta quedan fuera. Los
> cambios sin merge a main (p. ej. `feat/eros-email-hardening`) no se registran acá — cada lane
> documenta su entrada vía `pnpm changeset` al mergear su rama.
