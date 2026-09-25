# EROS — EROS-C3: Plan de consolidación de 14 MD legacy de raíz → `docs/`

Fecha: 2026-09-16 (verificado con `date`)
Repo: `E:/sitios web E/jacque/portadora-eras` → `E:/sitios web E/jacque/portadora-eros`
Rama detectada en esta sesión: `feat/eros-deps-p0` (el body decía `feat/rls-phase10`; sweep de 2026-09-16 corrió en esa rama. Confirmar rama al ejecutar.)
Estado: **PREPARACIÓN SOLO** — nada movido, nada borrado, nada editado. Espera OK de la dueña.
Autoría: 19-writer · Trailer que va en el commit de ejecución: `Generated-By: nvidia/muse-spark-1.3-contributor-free`

---

## 1. Contexto y regla que me ata

- `docs/` canónico existe: `01–07/*.md`, `adr/`, `STATUS.md`, `auditoria-admin.md`,
  `auditoria-responsive-mobile.md`, `eros-reporte-producto-marketing-estilo-2026-09-12.md`.
- `docs/STATUS.md` declara estas 14 archivas como **históricos** y deja EROS-C3 pendiente de OK del owner.
- `reports/full-sweep-2026-09-16.md` (P1-3) registra la consolidación como ticket **EROS-C3** con "no delete/reorg without LGTM".
- Regla del repo: *no reorg sin LGTM*. Por eso **no ejecuté** nada de la consolidación.

---

## 2. Inventario (14 archivos) — archivo / contenido / destino propuesto / histórico o reemplazable

| # | Archivo raíz | Líneas | Contenido (cabecera) | Destino propuesto | Tipo |
|---|---|---|---|---|---|
| 1 | `AUDITORIA_ADMIN_2024.md` | 224 | Auditoría del panel de administración (`/admin/*`) | `docs/archivo/auditorias/` | **Histórico** — superada por `docs/auditoria-admin.md` (2026-03-16, ya canónico) |
| 2 | `AUDITORIA_CALENDARIO_2024.md` | 183 | Auditoría del sistema de calendario y horarios (cliente + admin) | `docs/archivo/auditorias/` | **Histórico** — audit snapshot, decisiones ya aplicadas |
| 3 | `AUDITORIA_COMPLETA_2024.md` | 354 | Auditoría completa post-correcciones (Next 14, Resend) | `docs/archivo/auditorias/` | **Histórico** — superada por la 2026 (renglón 4) |
| 4 | `AUDITORIA_COMPLETA_2026.md` | 497 | Auditoría completa y exhaustiva (15-mar-2026, valoración 7/10) | `docs/archivo/auditorias/auditoria-completa-2026.md` | **Histórico (referencia viva)** — la más reciente/completa del lote; mantener como registro |
| 5 | `AUDITORIA_ESTETICA.md` | 421 | Auditoría estética minuciosa (spacing, colores, componentes) | `docs/archivo/auditorias/` | **Histórico** — superada por `docs/05-identidad-visual.md` (tokens) + `docs/auditoria-responsive-mobile.md` |
| 6 | `MEJORAS_ADICIONALES.md` | 421 | Mejoras premium propuestas (animaciones, micro-interacciones) | `docs/archivo/propuestas/` | **Histórico** — propuesta; solapada por `PROPUESTAS_MEJORAS.md` |
| 7 | `PLAN_CORRECCIONES.md` | 500 | Plan de correcciones estéticas (referencia AUDITORIA_ESTETICA + MEJORAS) | `docs/archivo/planes/` | **Histórico** — plan de implementación ya ejecutado |
| 8 | `PLAN_IMPLEMENTACION_FINAL.md` | 384 | Plan de implementación final para dejar el sitio listo | `docs/archivo/planes/` | **Histórico** — implementación terminada; estado vivo en STATUS.md |
| 9 | `plan_mejoras_calendario.md` | 121 | Plan mejoras calendario (vista semana/día, turnos externos) | `docs/archivo/planes/` | **Histórico** — solapado por renglones 10 y 2 |
| 10 | `PLAN_MEJORAS_CALENDARIO_CLIENTE.md` | 115 | Plan mejoras calendario lado cliente (overlap, horarios bloqueados) | `docs/archivo/planes/` | **Histórico** — se solapa con renglones 9, 2 |
| 11 | `plan-accion-2026-09-12.md` | 28 | Plan de acción por fases con dueños y gates (reciente) | **`plans/plan-accion-2026-09-12.md`** (NO archivo) | **Activo / reemplazable por vigencia** — plan operativo con fases y fechas; NO es histórico |
| 12 | `PROPUESTAS_MEJORAS.md` | 57 | Propuestas visuales y funcionales (page transitions, micro-interacciones) | `docs/archivo/propuestas/` | **Histórico** — propuesta conceptual |
| 13 | `plan.md` | 260 | Implementation Plan + Design System (paleta, stack Next 16) | `docs/archivo/planes/` | **Histórico** — superado por `docs/01–03` + `05` (design system canónico) |
| 14 | `plan_configuracion_admin.md` | 204 | Plan rediseño config admin estilo Notion/app nativa | `docs/archivo/planes/` | **Histórico** — propuesta de rediseño; estado vivo en `docs/02/03` |

**Resumen por tipo:**
- Históricos a archivar: **13**
- Activo (no archivar, mover a `plans/` con status schedule): **1** (`plan-accion-2026-09-12.md`)
- Auditorías: 5 · Planes: 7 · Propuestas: 2

---

## 3. Esquema de destino propuesto

Nuevo namespace `docs/archivo/` (archivo inerte, read-only, preserva todo, reversible):

```
docs/
├── archivo/
│   ├── auditorias/   → renglones 1,2,3,4,5
│   ├── planes/       → renglones 7,8,9,10,13,14
│   └── propuestas/   → renglones 6,12
plans/
└── plan-accion-2026-09-12.md   → renglón 11 (activo)
```

Alternativa si el owner prefiere seguir la convención de STATUS.md ("análisis viven en
`reports/` y `plans/`"): mover auditorías a `reports/auditor/archivo/` y planes/propuestas
a `plans/archivo/`. **Elección propia del owner — ese es precisamente el OK que falta.**

---

## 4. Procedimiento de ejecución (cuando haya OK — NO ejecutado ahora)

1. Pre-condición: git status limpio en la rama de trabajo; confirmar rama (sweep corrió en `feat/rls-phase10`).
2. `mkdir -p docs/archivo/{auditorias,planes,propuestas}`.
3. `git mv` de cada archivo a su destino (preserva historia; no editar contenido).
4. `plan-accion-2026-09-12.md` → `git mv` a `plans/` y **actualizar la fase 1/2** si aplica (rate-limit y unificación de rutas parecen ya resueltos en working tree según sweep §5 P0-1). Marcar qué fases quedan.
5. Ajustar `stats/STATUS.md`: marcar EROS-C3 como hecho y quitar la línea de "Deuda documental abierta" para estos 14 archivos; referenciar `docs/archivo/` como el archivo.
6. `docs/README.md`: agregar fila señalando `docs/archivo/` como archivo de histórico/docs de trabajo.
7. Verificar: `git status --short` muestra solo los renames + los 2 docs tocados; `git mv` no pierde nada (mismo blob, `git log --follow`).
8. Commit semántico, p.ej. `docs(eros): archive 14 legacy root .md into docs/archivo (EROS-C3)` + trailer `Generated-By: nvidia/muse-spark-1.3-contributor-free`.

**Prohibido en esta fase:** mover, borrar o editar los `.md` de raíz. Nada de esto se hizo.

---

## 5. Riesgos / notas para el owner

- **`plan-accion-2026-09-12.md` es activo y NO histórico**: archivar sin tocar su status dejaría fases huérfanas. Requiere decisión: mantener en `plans/` y actualizarlo, o archivarlo declarando qué fases ya se cumplieron (gate de sweep §5 indica P0-1 resuelto). El sweep lo dejó "UNVERIFIED · nada aplicado sin OK".
- **Renames con `git mv`** no alteran contenido → reversible con un `git mv` de vuelta; por eso recomiendo mover antes que borrar (cumple "sin borrar nada").
- Conflictos de ruta: ninguno detectado; `docs/archivo/` no existe aún.
- Los nombres `AUDITORIA_*.md` con año `2024` pero fechas internas `2026` son ruido de naming histórico; al archivar mantengo el nombre original para no perder trazabilidad (se puede renombrar en un paso aparte con decisión del owner).

## 6. Verificación de esta preparación

- No se ejecutó ningún `git mv`, `rm`, ni edición de los 14 `.md` de raíz.
- Cambio de esta sesión: solo este reporte nuevo en `reports/`.
- `git status --short` al final de la preparación para dejar evidencia de que todo lo demás quedó intacto (ver a continuación).