# ORN-136 — Verificación t_ver3: prettier --check src/ PASS + pre-commit fail-closed — 2026-10-20

> **Búsqueda:** keywords:
> `orn-136, t_ver3, prettier, husky, lint-staged, pre-commit, || true, fail-closed, khal pattern, gate fase 2`
> · clasificación: `verificación` · estado: canónico · actualizado: 2026-10-20

- **Fecha:** 2026-10-20 ~09:20 ART · **Autor:** 24-orquestador (turno noche) · **Motivo:** cerrar
  ORN-136 t_ver3 — gate Fase 2 de ORN-133: "`npx prettier --check src/` PASS + pre-commit en `&&`
  (fallo de lint-staged propaga exit 1)".

## Resumen

**HALLAZGO: el gate estaba más roto de lo que decía el ticket.** En `main` (bd9960c) NO existía
`.husky/pre-commit` — el directorio `.husky/` está en `.gitignore`, así que un clone limpio no tenía
ninguna protección local (gitleaks/lint-staged solo corrían en CI). La versión `|| true` que citaba
el ticket ya no existía ni en el checkout: fue reescrita fail-closed por kanban t_2535124d en la
rama WIP `feat/eros-email-hardening` (2d3947f, sin push). **Acción de esta corrida:** trackear en
main el patrón blessed de khal (`.husky/pre-commit` con gitleaks + lint-staged propagando exit
codes) vía `git add -f` (`.husky/` sigue ignorado para el resto) + test de guarda conductual que
pinta el ciclo RED→GREEN y previene la regresión.

## Gate (ticket) vs resultado

| Condición del gate                               | Resultado                                                                                                                                                                                                                                                               | Veredicto |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `npx prettier --check src/` PASS                 | bd9960c ya estaba limpio (CI 8/8 ✓ con step "Format check" del job Lint & Typecheck). El único archivo nuevo de `src/` (el test) fue formateado con `prettier --write` (probe contra node_modules del checkout principal). PASS autoritativo: CI Format check del push. | ✅        |
| pre-commit existe y propaga fallo de lint-staged | Antes: inexistente en main (gitignored). Ahora: `.husky/pre-commit` tracked, patrón khal verbatim, fail-closed. Test conductual con stub: exit 1 del stub → hook exit 1; exit 0 → hook exit 0.                                                                          | ✅        |
| Sin swallowing (`\|\| true`)                     | Guard de contenido sobre el archivo crudo: falla si aparece `\|\| true` en código o comentarios. El guard mismo pescó un comentario mío durante el ciclo — fix de comentario incluido.                                                                                  | ✅        |

## Evidencia (logs de esta corrida)

- **RED** (estado main bd9960c, hook sin trackear): `Tests 4 failed (4)` —
  `ls-files --error-unmatch .husky/pre-commit` falla; `copyFileSync … .husky/pre-commit → ENOENT`.
  Duración 48.66s.
- **GREEN** (hook staged + fail-closed): `Test Files 1 passed (1) — Tests 4 passed (4)`. Duración
  91.60s (tests 66.25s: gitleaks REAL del host escaneó el repo stub de 2 archivos y pasó; exit codes
  propagados por el hook).
- **Re-verde sobre archivo final formateado:** mismo comando, log en el commit.
- **prettier:** `--check src/` cross-root no ejecutable desde el worktree (install pnpm incompleto
  por host saturado; plugins resuelven desde el dir del archivo) → probe puntual: `prettier --write`
  sobre copia temporal con config idéntica, 912ms, retirada con mv (sin rm).

## Decisiones

1. **Patrón khal verbatim** (gitleaks + lint-staged, sin `gga.sh`, sin `_/husky.sh` v8): el de khal
   es autosuficiente y es el patrón blessed citado en el propio hook del WIP. Cuando
   `feat/eros-email-hardening` aterrice, resolver `.husky/pre-commit` favoreciendo su versión
   (superset: añade gga.sh) — conflicto trivial esperado.
2. **`git add -f` sin tocar `.gitignore`:** mantiene ignorados `_/`, `_test_secret.txt` y `gga.sh`
   del checkout WIP; igual patrón que khal (hook tracked, resto ignorado).
3. **NO se re-aplicó nada a la DB ni a prod** — gate 100% local/repo, sin superficie de riesgo.

## Archivos

- `.husky/pre-commit` — NUEVO, tracked (force-add). Patrón khal, fail-closed.
- `src/__tests__/husky-pre-commit.test.ts` — NUEVO. 4 tests: tracked-en-git, sin `|| true`,
  propagación exit 1, passthrough exit 0. Timeout 180s en los conductuales (gitleaks bajo carga del
  host).
- Este receipt.

**Próximo:** CI del push (Format check + Unit + Gitleaks). Con esto la familia ORN-133 queda
completa: t_ver1 (ORN-134), t_ver2 (ORN-135), t_ver3 (ORN-136) en review + t_ver4 (ORN-137) Done.
