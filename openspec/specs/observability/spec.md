# observability Specification

## Purpose

Añadir error boundaries, estados de loading en rutas admin, un contrato de error unificado en acciones server, limpiar logs de debug, resolver warnings de ESLint y configurar un test runner para verificación futura.

## Requirements

### Requirement: Error boundaries globales

La app MUST proveer `error.tsx` y `global-error.tsx` que capturen errores de render y de servidor, presentando una UI de fallback en lugar de un crash.

(Previously: sin boundaries — hallazgo E1)

#### Scenario: Error de render en ruta

- GIVEN un componente que lanza error
- WHEN se renderiza
- THEN `error.tsx` muestra el fallback y NO crashea la app

### Requirement: Loading en rutas admin

Las rutas admin MUST proveer `loading.tsx` para ofrecer feedback de carga mientras se resuelven datos.

(Previously: sin estados de carga — hallazgo E2)

#### Scenario: Navegación admin lenta

- GIVEN una ruta admin con datos pendientes
- WHEN se navega
- THEN se muestra un estado de loading

### Requirement: Contrato de error unificado en acciones

Las acciones de servidor MUST seguir un contrato de error unificado consistente (throw + boundary), eliminando los `console.log` de debug.

(Previously: contrato mixto + logs de debug — hallazgo C4/E3)

#### Scenario: Acción falla

- GIVEN una acción server falla
- WHEN se ejecuta
- THEN devuelve error según contrato unificado, sin `console.log` de debug en producción

### Requirement: ESLint limpio

El proyecto MUST pasar `npx eslint` sin warnings, eliminando la confirmación "disabled" y reglas pendientes.

(Previously: ESLint con confirmation disabled — hallazgo E4)

#### Scenario: Lint pass

- GIVEN el código del proyecto
- WHEN se ejecuta `npx eslint`
- THEN no reporta warnings

### Requirement: Test runner configurado

El proyecto MUST contar con un test runner configurado (mínimo un smoke test) para habilitar verificación futura.

(Previously: sin test runner — hallazgo E5)

#### Scenario: Smoke test ejecuta

- GIVEN el test runner configurado
- WHEN se ejecuta el comando de test
- THEN el smoke test pasa y reporta resultado