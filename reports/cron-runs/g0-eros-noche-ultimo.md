# G0 Ciclo nocturno EROS — 2026-10-06 (turno noche, 7ma corrida consecutiva sin tarea)

## F0.a clasificación

**SANO** — HEAD `409bfdf`. Tree limpio salvo artefactos preexistentes no mutados por este cron
(`plans/`, `reports/cron-runs/g0-eros-noche-2026-10-02.md`, `run_kanban.py`, `run_kanban2.py`,
`todo_kb.py`). Sin drift de código desde 2026-10-04.

## Delta vs baseline.md

Sin baseline — gap conocido. **7ma corrida consecutiva sin ticket F2.baseline-md** adjudicado.

## Kanban EROS (∩ ORN-*) — releído 2026-10-06 %LocalAppData%/hermes/kanban.db

- **117 tarjetas activas (ready/running/review) matching `EROS|ORN-*`** (vs 17 del turno anterior —
  mirror Linear amplió el pool; la señal estructural NO cambia).
- **0/117 llevan `Avanza: F<n>.<criterio>`** (verificado programáticamente sobre title +
  body[:600]).
- Muestreo, todo ready **sin Avanza:**:
  - foco pagos/booking: `t_9ac393b0` ORN-170 RPC create_booking, `t_21b5f926` ORN-137 t_ver4 camino
    único, `t_e03544bf` ORN-133 F1+F2 gates, `t_4baf4455` ORN-160 RLS library, `t_5fbd4904` ORN-172
    MP real en seña
  - gates DB/RLS: `t_c77ba8a8` ORN-135 t_ver2 RLS phase10, `t_52ab7776` ORN-168, `t_246cf707`
    ORN-166, `t_9e532e14` ORN-161
  - SEC: `t_c6d282eb` ORN-196 eros 61 HIGH + 4 CRITIC, `t_ba308e06` EROS-DEPS-P0 bump next 16.3.5
    GHSA-ggv3
  - sanity: `t_f9a893f0` EROS-LINT, `t_eros_stable` CI rojo 14 runs
  - duplicados mirror: `t_a030b26d` + `t_6211cdb4` EPIC EROS gate 🟡 (mismo título)
  - señal-only no accionable: `t_sl544_44217` HTTP 544 Supabase pausado, `t_1edf4527` review-cron
    HTTP 429 nvidia (meta, no EROS código)
- blocked EROS >48h (escaladas al digest, no se tocan): EROS-LINT, EROS-DOMAIN, EROS-DEPS-P0

## Kanban EROS (estado REAL, kanban.db %LocalAppData%/hermes — RELEÍDO 2026-10-06)

- **ready/running/review EROS ∪ ORN: 17 tarjetas** (vs 323 reportadas 2026-10-04 — hubo triaje
  batch, señal positiva del humano).
- **0/17 llevan `Avanza: F<n>.<criterio>`** — regla contrato 28/09 las devuelve al 24.
- Muestreo actual:
  - `t_c6d282eb` ORN-196 [SEC] upgrade deps 61 HIGH + 4 CRITIC (priority 0, **sin Avanza:**)
  - `t_21b5f926` ORN-137 t_ver4 verificar camino único reserva + B1 (pagos/booking foco, **sin
    Avanza:**)
  - `t_e03544bf` ORN-133 Verificación Fase 1+2 gates (pagos/booking, **sin Avanza:**)
  - `t_1514fc01` ORN-117 PITR EROS+KHAL+TRINO (DBA, **sin Avanza:**)
  - `t_sl544_44217` [SRE] Backend Supabase http 544 proyecto pausado (signal-only)
  - `t_1edf4527` review-cron: HTTP 429 nvidia kimi-k3 drained (meta-cron, no EROS código)
- **blocked EROS (3)**: EROS-LINT, EROS-DOMAIN, EROS-DEPS-P0 — todas >48h, escaladas al digest por
  contrato, no se trabajan.

## Linear EROS

Sin mutaciones. Sin mirror nuevo identificado en esta vuelta.

## Decisión (contrato 28/09: "Ticket sin Avanza: lo devuelve el 24")

1. NO tomar ready sin `Avanza:` — regla estricta (0/117).
2. NO tomar blocked >48h (escaladas a digest).
3. Foco pagos/booking/SEC/DB/CI completo disponible pero **sin excepción sin `Avanza:`** → devueltas
   al 24.
4. → **7ma corrida consecutiva sin tarea ejecutable.** Señal estructural se agrava: el pool activo
   creció (17→117) pero las tarjetas arriban del mirror Linear sin pasar por el paso humano de
   adjuntar `Avanza:`.

## Sin commit/push de código

No se mutó `src/`, `tests/`, `docs/` de producto. Único cambio: este reporte.

## Sugerencias al 24-humano (urgentes)

1. **Adjuntar `Avanza: F<n>.<criterio>`** a AL MENOS UNA ready. Sugerencias concretas por foco
   producción:
   - **ORN-170 RPC create_booking con backend real** → `type: feature` + `Avanza: F5.slice-booking`
   - **ORN-137 t_ver4 camino único reserva** → `type: task-derivado` + `Avanza: F3.verification`
   - **ORN-196 SEC eros 61 HIGH + 4 CRITIC** → `type: operativo` + `Avanza: F3.deps-sec`
2. **Crear ticket** `type: fix-chico` + `Avanza: F2.baseline-md` (7ma mención).
3. **Desduplicar EPIC EROS**: `t_a030b26d` y `t_6211cdb4` son el mismo título — síntoma del P0
   conocido `t_f0750d9c` (mirror Linear->kanban crea duplicados en masa).
4. **PAUSAR este cron o bajarlo a semanal.** 7 corridas consecutivas con la MISMA señal estructural
   ya son evidencia suficiente. La señal queda registrada; reactivar cuando alguna tarjeta tenga
   `Avanza:`.

[estatus] sin tarea con criterio ejecutada por este agente (7ma corrida consecutiva) [resumen] HEAD
409bfdf sano; board EROS∩ORN creció 17→117 activas por ampliación del mirror Linear pero 0/117
tienen Avanza:; foco pagos/booking/SEC/RLS completo devuelto al 24 por contrato 28/09 [riesgo] bajo
código / ALTO proceso — paso humano "adjuntar Avanza:" no ocurre hace 7 corridas; dup EPIC EROS es
síntoma del bug P0 mirror (t_f0750d9c) [archivos]
E:/Hermes/projects/eros/reports/cron-runs/g0-eros-noche-ultimo.md (este) [tests] no aplica — no se
tocó código [sigue] humano: PAUSAR cron o semanal + poner Avanza: a ORN-170/137/196 + crear
F2.baseline-md + desduplicar EPIC EROS
