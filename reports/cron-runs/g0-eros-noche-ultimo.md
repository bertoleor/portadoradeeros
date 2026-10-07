# G0 Ciclo nocturno EROS — 2026-10-07 (turno noche, 8va corrida consecutiva sin tarea)

## F0.a clasificación

**SANO** — HEAD `4171c17` (branch `feat/eros-deps`, al día con origin). Tree limpio salvo
`.codegraph/` (artefacto IDE local). Sin drift desde 2026-10-06.

## Delta vs baseline.md

Sin baseline — gap conocido. **8va corrida consecutiva sin ticket F2.baseline-md** adjudicado.

## Kanban EROS (∩ ORN-*) — releído 2026-10-07 %LocalAppData%/hermes/kanban.db

- **102 tarjetas activas (ready/running/review) matching `EROS|ORN-*`** (vs 117 ayer — leve triaje;
  la señal estructural NO cambia).
- **0/102 llevan `Avanza: F<n>.<criterio>`** — verificado programáticamente sobre title +
  body[:600].
- **blocked EROS (4)**: ORN-207 (aplazado por owner), ORN-160 RLS library premium, ORN-116 [PAEONIA]
  FK/índices, ORN-31 [PAEONIA] integridad .se1 — todas >48h o congeladas por owner, escaladas al
  digest, no se tocan.

## Linear EROS

Sin mutaciones observadas en esta vuelta. Los espejos ORN-* siguen arribando sin pasar por el paso
humano de adjuntar `Avanza:` + `type:`.

## Decisión (contrato 28/09: "Ticket sin Avanza: lo devuelve el 24")

1. NO tomar ready sin `Avanza:` — regla estricta (0/102).
2. NO tomar blocked >48h (escaladas a digest).
3. Foco pagos/booking/SEC completo disponible pero **sin excepción sin `Avanza:`** → devuelto al 24.
4. → **8va corrida consecutiva sin tarea ejecutable.**

El cron **sigue consumiendo tokens sin producir trabajo producto del gating humano faltante**.
Reitero con máxima urgencia la sugerencia del turno anterior.

## Sin commit/push de código

No se mutó `src/`, `tests/`, `docs/` de producto. Único cambio: este reporte.

## Sugerencias al 24-humano (URGENTES, 8va repetición)

1. **PAUSAR este cron o bajarlo a semanal.** 8 corridas consecutivas con idéntica señal estructural
   ya superan el umbral de evidencia. Reactivar cuando alguna tarjeta tenga `Avanza:`.
2. **Adjuntar `Avanza:` + `type:`** a AL MENOS UNA ready (sugerencias: ORN-170, ORN-137, ORN-196).
3. **Crear ticket** `type: fix-chico` + `Avanza: F2.baseline-md` (8va mención).
4. **Desduplicar EPIC EROS** (síntoma del P0 del mirror Linear→kanban, `t_f0750d9c`).

[estatus] sin tarea con criterio ejecutada por este agente (8va corrida consecutiva) [resumen] HEAD
4171c17 sano; board EROS activas 117→102, 0/102 con Avanza:; foco pagos/booking/SEC devuelto al 24
por contrato 28/09; 4 blocked escaladas (ORN-207/160/116/31) [riesgo] bajo código / ALTO proceso —
paso humano "adjuntar Avanza:" no ocurre hace 8 corridas; cron quema tokens sin valor [archivos]
E:/Hermes/projects/eros/reports/cron-runs/g0-eros-noche-ultimo.md (este) [tests] no aplica — no se
tocó código [sigue] humano: PAUSAR cron o semanal + poner Avanza: a una tarjeta + crear
F2.baseline-md
