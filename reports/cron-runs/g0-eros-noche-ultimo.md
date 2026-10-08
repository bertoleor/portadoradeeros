# G0 Ciclo nocturno EROS — 2026-10-08 (turno noche, 9na corrida consecutiva sin tarea)

## F0.a clasificación

**SANO** — HEAD `1b8df8c` en `feat/eros-deps` (post-merge audit F4 D2/D5 de deps). Tree con
drift conocido NO comprometido: `package.json`, `package-lock.json`, `pnpm-lock.yaml`
modificados en workspace (entregable del audit F4 previo); `.codegraph/` artefacto IDE local.
1 commit ahead de origin = audit F4 propio ya commiteado.

## Delta vs baseline.md

`docs/baseline.md` NO existe — gap conocido. **9na corrida consecutiva sin ticket
F2.baseline-md adjudicado.**

## Kanban EROS (∩ ORN-*) — releído 2026-10-08 `%LocalAppData%/hermes/kanban.db`

- **61 tarjetas activas** (vs 102 ayer — triaje overnight considerable; señal estructural NO
  cambia). Verificado programáticamente `tasks.status IN ('ready','running','review')` filtrado
  regex `EROS|ORN-` title+body[:600].
- **0/61 llevan `Avanza: F<n>.<criterio>`** — regex `Avanza:\s*F\d+\.` sobre title+body.
- **blocked EROS 48** (ORN-207 aplazado owner, ORN-160 RLS premium, ORN-116/31 [PAEONIA],
  ORN-150 TRINO / ORN-149 OMAKASE / ORN-146 PAEONIA planes 14/09 congelados, ORN-138
  cron-autofix, etc.) — todas >48h o congeladas, escaladas al digest, no se tocan.

## Linear EROS

Sin mutaciones observadas. El mirror Linear→kanban sigue trayendo ORN-* sin etiqueta humana
`Avanza:` + `type:` (P0 ya reportado `t_f0750d9c`).

## Decisión (contrato 28/09: "Ticket sin Avanza: lo devuelve el 24")

1. NO tomar ready sin `Avanza:` — regla estricta (0/61).
2. NO tomar blocked >48h — escaladas al digest.
3. Foco pagos/booking/SEC disponible pero **sin `Avanza:` no hay excepción** → devuelto al 24.
4. → **9na corrida consecutiva sin tarea ejecutable.**

El cron **sigue consumiendo tokens sin producir trabajo** producto del gating humano faltante.

## Sin commit/push de código

No se mutó `src/`, `tests/`, `docs/` de producto. Único cambio: este reporte (trazabilidad del
cron).

## Sugerencias al 24-humano (URGENTES, 9na repetición)

1. **PAUSAR este cron o bajarlo a semanal.** 9 corridas consecutivas con idéntica señal
   estructural ya superan cualquier umbral razonable. Reactivar cuando una tarjeta tenga
   `Avanza:`.
2. **Adjuntar `Avanza:` + `type:`** a AL MENOS UNA ready (sugerencias: ORN-170, ORN-137,
   ORN-196).
3. **Crear ticket** `type: fix-chico` + `Avanza: F2.baseline-md` (9na mención).
4. **Desduplicar EPIC EROS** (síntoma del P0 del mirror Linear→kanban, `t_f0750d9c`).

[estatus] sin tarea con criterio ejecutada por este agente (9na corrida consecutiva) [resumen]
HEAD 1b8df8c sano (post-audit F4 D2/D5 deps); board EROS activas 102→61, 0/61 con Avanza:;
blocked 48 escaladas al digest (ORN-207/160/116/31 et al); foco pagos/booking/SEC devuelto al
24 por contrato 28/09 [riesgo] bajo código / ALTO proceso — paso humano "adjuntar Avanza:" no
ocurre hace 9 corridas; cron quema tokens sin valor [archivos]
E:/Hermes/projects/eros/reports/cron-runs/g0-eros-noche-ultimo.md (este) [tests] no aplica —
no se tocó código [sigue] humano: PAUSAR cron o semanal + adjuntar Avanza: a una tarjeta +
crear F2.baseline-md
