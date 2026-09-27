# Changelog — portadora-eros
> Parte de: [[projects/eros/README|README]] · Relacionados: [[projects/eros/STATUS|STATUS]] · [[docs/proyectos/eros|eros]] · [[ESTADO-FLOTA-2026-09-14]]

Formato: Keep a Changelog simplificado. Todo UNVERIFIED hasta revisión humana.

## [Unreleased] — 2026-09-12

### Added

- Auditoría general Modo A: `reports/auditor/general-eros-2026-09-12.md` (baseline 10 lentes).
- Triaje de gaps A/B/C: `reports/project-analysis/eros-gaps.md` (dry-run kanban).
- ADR-0001: allowlist de admin vía `is_admin()` (`docs/adr/0001-admin-allowlist-is-admin.md`).

### Noted (no aplicado, pendiente aprobación)

- Rate-limit + honeypot en `/api/appointments` y `/api/contact` (EROS-A1).
- Revisión RLS de `migration_phase10.sql` (EROS-A2).
- Quitar `maximumScale: 1` del viewport (EROS-C1).
