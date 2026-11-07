# Admin Security Hardening — Runbook ORN-217

**Feature:** `feat/admin-security-hardening`  
**Branch:** `feat/admin-security-hardening` (from `feat/eros-email-hardening`)  
**Created:** 2026-11-06  
**Owner:** Admin team

---

## Problema

Endpoints y componentes administrativos del ecosistema eros requerían endurecimiento de seguridad integral que cubría:
- Encriptación AES-256-GCM de datos bancarios (CBU, alias, owner, name)
- Validación de comprobantes de pago (Zod `.url()` + estado `pending_payment`)
- Validación CBU/alias en tiempo de creación
- Cierre seguro de modales con FocusTrap para accesibilidad
- Políticas RLS en base de datos

---

## Pasos para reproducir

### 1. Verificar encriptación bancaria

```bash
# Ejecutar tests de encriptación
pnpm test -- src/__tests__/bank-encryption.test.ts
```

### 2. Validar modales accesibles

```bash
# Verificar typecheck después de T15
pnpm run typecheck
```

### 3. Confirmar políticas RLS

```bash
# Revisar migraciones aplicadas
cat migrations/0002_add_payment_proof_and_status.sql
```

---

## Comandos de solución

### Encriptación bancaria

```bash
# Ejecutar suite completa de tests
pnpm test -- --reporter=verbose src/__tests__/bank-encryption.test.ts
```

### Validación de pago y CBU/alias

```bash
# Ejecutar tests de proof validation
pnpm test -- src/__tests__/payment-proof.test.ts
```

### Typecheck

```bash
pnpm run typecheck
# Debe retornar 0 errores (excluyendo GardenCanvas/GardenSection de rama separada)
```

### Modales con FocusTrap

```bash
# Verificar todos los tests pasan
pnpm test
# 198 passed, 30 skipped, 7 pre-existing failures
```

---

## Verificación posterior

### Checks post-deploy

| Componente | Test | Comando |
|------------|------|---------|
| Bank encryption | ✅ 177-line TDD suite | `pnpm test -- src/__tests__/bank-encryption.test.ts` |
| Payment proof | ✅ Schema validation | `pnpm test -- src/__tests__/payment-proof.test.ts` |
| FocusTrap modales | ✅ Accessibility | `pnpm test` + inspección visual |
| TypeScript | ✅ 0 errors | `pnpm run typecheck` |
| Strix security | ✅ 0 findings | Strix deep scan |

### Evidencias esperadas después de merge a main

- `pnpm run typecheck` → 0 errors
- `pnpm test` → 198 passed, 30 skipped, 7 pre-existing failures
- Strix deep scan → 0 findings
- `docs/runbooks/admin-security-hardening.md` → creado y versionado
- `odd/tasks/eros-admin-security-hardening.md` → T15 marcado como done, T16/T17 pendientes

---

## Notas importantes

1. **Bank encryption** usa AES-256-GCM con HKDF — llave derivada por campo (salt por campo: cbu, alias, owner, name)
2. **FocusTrap** componente compartido — aplicado a ConfirmModal y BlockModal
3. **No hay credenciales hardcodeadas** — todas reemplazadas con [REDACTED]
4. **Biome v2.6.4 + jscpd + knip** — calidad matching khal
5. **5-attempt eslint-disable rule** — cultural rule from khal

---

**Siguiente:** T17 — Actualizar auditoría (ORN-??)

**Previous runbook:** `docs/runbooks/database-migration.md` (pending)