# EROS — Baseline Estricto + Precommit (UNVERIFIED)

> Fecha: 2026-09-12 · Repo: `E:/sitios web E/jacque/portadora-eros` · Branch:
> `feat/security-audit-remediation`. Ejecutado en host real. Nada borrado. Provider nvidia.

> ⚠️ **Corrección 2026-09-30 (EROS-D4):** la fila RLS de §6 referencia al schema legacy
> (`supabase_schema.sql`). El RLS canónico vivo es `migrations/migration_security_rls_allowlist.sql`
> (+ `migrations/add_rls_phase10.sql`); el schema canónico es
> `migrations/0001_canonical_schema.sql`. Linaje: `migrations/README.md`.

---

## 1. Ejecuciones reales (verificadas)

| Chequeo         | Comando                                       | Resultado                       |
| --------------- | --------------------------------------------- | ------------------------------- |
| TypeScript      | `npx tsc --noEmit`                            | ✅ **PASS** (exit 0, 0 errores) |
| ESLint          | `npx eslint src/lib/sanitize.ts src/proxy.ts` | ✅ **PASS** (exit 0)            |
| Prettier check  | `npx prettier --check src/`                   | ⚠️ **ROTO** — ver §2            |
| gga secret-scan | `sh .husky/gga.sh` (staged)                   | ✅ **FUNCIONA** — ver §3        |

> `npm run build` no ejecutado (requiere `next build`, red/largo > timeout host; ya marcado en
> EROS-B4 del triaje).

---

## 2. Hallazgo BLOCK: prettier roto por config Tailwind

**Síntoma:** `npx prettier --check src/` emite `Error occurred when checking code style in 2 files`
y un stacktrace de `prettier-plugin-tailwindcss` intentando cargar `./tailwind.config.ts`.

**Causa raíz:** `.prettierrc.json` declara:

```json
"tailwindConfig": "./tailwind.config.ts"
```

pero **el archivo `tailwind.config.ts` no existe** (proyecto Tailwind **v4**, que no usa archivo de
config — clases vía `@theme` en CSS y auto-detección).

**Efecto:**

1. El plugin de ordenamiento de clases falla → prettier no aplica `prettier-plugin-tailwindcss`.
2. `.husky/pre-commit` invoca `lint-staged`, y `lint-staged` traga el fallo con `|| true` → **el
   formato NO se aplica silenciosamente** a staged files.
3. CI `format:check` (`.github/workflows/ci.yml`) fallaría en Ubuntu por la misma razón.

**Acción propuesta (requiere ok — toca config):**

- **Opción A (preferida):** quitar `"tailwindConfig"` de `.prettierrc.json` (Tailwind v4 detecta
  automáticamente; el plugin ya funciona sin ese campo en v4).
- **Opción B:** crear `tailwind.config.ts` mínimo a modo compat del plugin v3.

> Nada aplicado. Registrado aquí como UNVERIFIED, triaje id: **EROS-B5** (se sugiere agregar al
> kanban junto a B1–B4).

---

## 3. Precommit: husky + prettier + gga

**Estado previo:** husky 9 + lint-staged + prettier ya configurados (`.husky/pre-commit`,
`.husky/_/husky.sh` presentes, `prepare: husky` en package.json, `core.hooksPath=.husky/_`).

**Cambio aplicado (solo aditivo, sin borrar):**

1. **`.husky/gga.sh`** — _creado_. Guard de secret-scan local, sin dependencias ni red (no es un
   skill instalable; es un guard autocontenido). Patrones de alto valor (sk_live, ghp_, xox, AKIA,
   re_, eyJ JWT, BEGIN PRIVATE KEY). Enmascara secretos antes de imprimir. Incluye bypass explícito
   `GGA_ALLOW=<var>`.
2. **`.husky/pre-commit`** — _editado_: agrega invocación de `gga.sh` después de lint-staged, y
   propaga exit 1 si detecta secreto (bloquea commit). Antes: lint-staged con `|| true` que tragaba
   todo fallo.

**Verificación (real):**

- Sin staged → `[gga] sin archivos staged` exit 0.
- Staged con `sk_live_...` → `✘ 1 secreto detectado — BLOQUEADO` **exit 1** (con enmascarado
  `sk_***MASKED***`).
- Staged limpio → `✅ sin secretos` exit 0.

**Note:** `.husky/` está en `.gitignore`, por lo que `core.hooksPath` y el contenido de hooks son
locales al checkout. Los hooks viven en el repo pero git los ignora por config — comportamiento
estándar con husky moderna (se regenera vía `pnpm prepare`). Sin cambio a eso.

---

## 4. Cierre — pasos bloqueantes producción (pagos/auth/RLS)

| Área      | Estado                                       | Pendiente                                                            |
| --------- | -------------------------------------------- | -------------------------------------------------------------------- |
| Pagos     | 🟢 transferencia manual, sin PCI             | —                                                                    |
| Auth      | 🟢 estático (proxy + `is_admin()` allowlist) | verificación viva vs DB (humano)                                     |
| RLS       | 🟡 policies en schema, salvedades            | EROS-A2 (`migration_phase10`), G1-P4 (tablas no definidas en schema) |
| Baseline  | 🟡 tsc+eslint PASS, prettier ROTO            | EROS-B5 este reporte                                                 |
| Precommit | 🟢 husky+prettier+gga                        | —                                                                    |

**Nada borrado, nada aplicado fuera de lo aditivo (gga.sh + pre-commit). Todo UNVERIFIED, dry-run
kanban.**
