# EROS — Plan de acción 2026-09-12 (UNVERIFIED)
> Parte de: [[projects/eros/README|README]] · Relacionados: [[EROS-plan-2026-09-14]] · [[INDICE-PLANS]] · [[projects/eros/STATUS|STATUS]]

> Fuente: consolidado 2026-09-12 + `docs/eros-reporte-producto-marketing-estilo-2026-09-12.md` +
> gaps EROS. Branch `feat/security-audit-remediation`. Nada aplicado sin OK de Jacque.

## Fase 1 — Reserva única + anti-abuso · due 2026-09-19 · dueño: Backend Developer senior

- Unificar doble camino: `POST /api/appointments` (email-only, sin persistencia) vs server action
  `createAppointment()` (sí persiste). Decidir uno canónico; el otro se elimina o se vuelve alias.
- Rate-limit en `appointments`/`contact` (hoy abuso abierto); `contact` no debe silenciar fallo de
  insert.
- **Gate:** un solo camino de reserva con test de colisión + rate-limit verificado con curl.

## Fase 2 — DB viva + prettier · due 2026-09-26 · dueño: DBA senior + Frontend Developer senior

- `migration_phase10.sql`: agregar policies faltantes (riesgo RLS); alinear schema canónico con
  `contact_messages`/`push_subscriptions`/`admin_users`.
- Fix `.prettierrc.json` (apunta a `tailwind.config.ts` inexistente con Tailwind v4); devolver husky
  a `&&` (hoy `|| true` traga el error).
- **Gate:** migración aplicada en DB viva + `tsc`/`eslint` PASS + pre-commit en `&&`.

## Fase 3 — Estilo canónico + marketing · due 2026-10-03 · dueño: UI/UX senior + Content/SEO senior

- **Decisión humana (Jacque):** burgundy sólido vs dark+rojo+mesh; aprobar triaje A/B/C + G1.
- Metadata dinámica por servicio + `LocalBusiness` schema; completar redes FB/Twitter/YT en admin si
  hay perfiles activos.
- Evaluar link de pago (MP/MODO sin tokenizar) manteniendo sin-PCI.
- **Gate:** screenshot comparativo firmado por Jacque + SEO por servicio verificado.
