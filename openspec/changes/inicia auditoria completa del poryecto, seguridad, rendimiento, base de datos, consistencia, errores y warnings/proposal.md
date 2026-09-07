# Proposal: Auditoría completa del proyecto — remediación integral

## Intent

Auditoría completa del proyecto portadora-eros con remediación de TODOS los hallazgos verificados en vivo (no solo reporte) en seguridad, rendimiento, base de datos, consistencia y errores/warnings. El objetivo es corregir exposiciones reales y latentes, consolidar una única fuente de verdad y dejar el proyecto listo para verificarse de forma sostenible.

## Scope

### In Scope (fix everything — opción 3)

| Dimensión | Hallazgos (verificados en vivo) |
|-----------|----------------------------------|
| Seguridad | S3 cierre signup + allowlist admin · S1 RLS en clients/appointments/blocked_times · S2 guard defense-in-depth · S4 hygiene de secretos · S5 XSS admin-only · S6 validación status en booking · S7 zod en endpoints públicos · S8 eliminar supabaseAdmin muerto |
| Rendimiento | P1 findClient() scan+N+1 · P2 getNextAvailableSlots loop 30d · P3 caching/revalidate lib/api/* · P4 refetch global admin calendario · P5 getBookedSlots filtra en JS |
| Base de datos | D1 drift CONFIRMADO (messages/settings no existen → 404) · D2 tipos TS obsoletos · D3 índice appointment_date · D4 unique constraint email |
| Consistencia | C1 unificar auth · C2 unificar clientes Supabase · C3 mappers deduplicados · C4 contrato de error · C5 fuente única de servicios |
| Errores/warnings | E1 error.tsx/global-error.tsx · E2 loading.tsx admin · E3 limpiar console.log · E4 ESLint + confirmation "disabled" · E5 test runner (habilita verificación futura) |

### Out of Scope / Non-Goals
- Rediseño visual ni nuevas funcionalidades.
- Integración Google Calendar (sigue en stub `.env`).
- Migración de stack o refactor de arquitectura mayor.
- Cambios no derivados de los hallazgos anteriores.

## Capabilities

### New Capabilities
- `auth-hardening`: cierre de signup, allowlist de admin, guard server-side (S2/S3/S7).
- `row-level-security`: políticas RLS efectivas en clients/appointments/blocked_times (S1).
- `data-access-layer`: queries indexadas, caching, contrato de error único (P1–P5, D3, C4).
- `booking-validation`: validación zod del POST público de reservas (S6).
- `schema-consolidation`: migraciones Supabase como fuente única + tipos generados (D1/D2/D4).
- `observability`: error.tsx/loading.tsx/global-error boundaries (E1/E2).

### Modified Capabilities
- None (sin specs previas en `openspec/specs/` — se crean desde cero).

## Approach

Remediation dirigida por severidad sobre cada dimensión. Para D1 se adopta **migraciones Supabase como única fuente de verdad del schema**, generando tipos TS en vez de mantenerlos a mano. Para C4 se define un **contrato de error único** (throw + error boundary) eliminando los `{}success,error}` y silencios vacíos. Para rendimiento se introduce **caching RSC + index de DB** en paths calientes.

## Affected Areas

| Area | Impact | Descripción |
|------|--------|-------------|
| `src/lib/supabase/{server,client}.ts` | Modified | unificar clientes, generar tipos |
| `src/lib/supabase.ts` | Removed | dead module reemplazado |
| `migrations/` | Modified | consolidar a una fuente de verdad |
| `src/lib/api/*` | Modified | P1–P5, C3, C4, S6, S7 |
| `src/app/**` | Modified | error/loading boundaries, XSS, guards |
| `.env.local` / `.env.example` | Modified | rotar/eliminar secretos, documentar |

## Prioritized Remediation Plan

1. **S3** — `disable_signup=true` + reescribir policies a allowlist explícita (el usuario legítimo queda admin).
2. **S1** — habilitar RLS + policies mínimas en `clients`/`appointments`/`blocked_times`.
3. **D1** — crear `messages` y `settings` + consolidar migraciones (unblock admin UI).
4. **S2/S6** — guard de sesión en acciones server + validación zod de `status`.
5. **S4** — rotar `SUPABASE_SERVICE_ROLE_KEY`, eliminar `RESEND_API_KEY` muerto, completar `.env.example`.
6. **S5** — sanitizar/limitar `dangerouslySetInnerHTML` (contenido admin-only, low severity).
7. **S7/S8** — zod en endpoints públicos + eliminar `supabaseAdmin`.
8. **P1/P2/P3** — queries indexadas + caching RSC.
9. **P4/P5, C1/C2/C3/C4/C5, D2/D3/D4** — consistencia y tipos.
10. **E1–E5** — boundaries, loading, lint, test runner.

## Key Decisions & Tradeoffs

- **Schema fuente única**: migraciones Supabase sobre 7 archivos solapados (costo: reescritura inicial; beneficio: sin drift).
- **Contrato de error**: `throw` + boundary global en vez de mix `{success}`/silencioso (sacrifica "fail open" intencional de checkSlotAvailability).
- **Caching**: RSC caching + revalidate específico vs invalidation global (menos refetch, más complejidad).
- **Allowlist admin**: tabla/Hardcoded config vs RLS `auth.role()` (decidir en design; RLS-por-rol es el bug actual).

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Rotación de service-role rompe integraciones | Med | coordinar rotación, probar antes de eliminar key vieja |
| Migraciones a prod con datos | Med | migración backward-compatible, backup antes |
| Allowlist bloquea admin legítimo | Baja | preservar UID existente, verificar post-deploy |
| Caching sirve datos stale | Med | revalidate por mutación, no solo por tiempo |

## Rollback Plan

- **S3/S1**: revertir policies + `disable_signup` vía migración inversa.
- **D1**: migraciones revertibles (down) o snapshot previo.
- **Secretos**: conservar key rotada anterior hasta verificar funcionamiento.
- **Perf/caching**: desactivar revalidation (flag) sin tocar queries.

## Dependencies
- Acceso a Supabase dashboard/CLI para migraciones y políticas.
- Verificación de que el usuario existente es el admin legítimo (confirmar antes de S3).

## Success Criteria

- [ ] Signup cerrado y sin privilegios admin por defecto (S3 verificado por test manual/HTTP).
- [ ] RLS efectiva: anon no puede SELECT `clients`/`appointments`/`blocked_times`.
- [ ] `messages`/`settings` existen en DB y admin UI carga sin 404.
- [ ] `tsc --noEmit` y `npx eslint` limpios; `npm run build` sin warnings.
- [ ] 0 hallazgos de seguridad/render/consistencia pendientes del audit.
- [ ] Test runner configurado (mínimo smoke) para verificación futura.