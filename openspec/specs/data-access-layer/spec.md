# data-access-layer Specification

## Purpose

Eliminar full-scans y N+1 en acceso a datos, introducir queries indexadas y caching RSC con revalidación, y consolidar un contrato de error único en la capa de API.

## Requirements

### Requirement: findClient por índice, no scan

`findClient()` MUST consultar directamente por `email`/`phone` (indexado) en lugar de cargar todos los registros y filtrar en memoria. Un índice/constraint de unicidad SHOULD respaldar la búsqueda por email.

(Previously: carga-toda-y-filtra con N+1 — hallazgo P1)

#### Scenario: Búsqueda por email indexado

- GIVEN un cliente con email conocido
- WHEN `findClient` recibe ese email
- THEN se ejecuta UN solo query indexado y retorna el cliente

#### Scenario: Sin coincidencia

- GIVEN un email que no existe
- WHEN `findClient` consulta
- THEN retorna un resultado vacío sin escanear la tabla completa

### Requirement: Slots calculados sin loops 30d

`getNextAvailableSlots` y `getBookedSlots` MUST resolver disponibilidad/ocupación mediante queries de rango sobre `appointment_date` (indexado) en vez de iterar 30 días en JS y filtrar en memoria.

(Previously: loops de 30 días + filtro en JS — hallazgos P2/P5; índice D3)

#### Scenario: Slots disponibles por rango

- GIVEN un rango de fechas y slot de duración
- WHEN se pide disponibilidad
- THEN las filas bloqueadas/reservadas se obtienen con un query de rango, sin iterar día a día

### Requirement: Caching RSC con revalidación

Los endpoints de `src/lib/api/*` en paths calientes SHOULD cachear respuestas RSC y revalidar por mutación (no solo por tiempo), evitando refetch global del calendario admin.

(Previously: refetch global — hallazgos P3/P4)

#### Scenario: Revalidación por mutación

- GIVEN una reserva se crea/actualiza
- WHEN la mutación termina
- THEN el cache del calendario se invalida de forma dirigida, no global

#### Scenario: Datos no stale

- GIVEN cache RSC activo
- WHEN no hubo mutación
- THEN se sirve cache sin refetch innecesario

### Requirement: Contrato de error único

La capa de API MUST emitir errores mediante throw + error boundary, eliminando los mixes `{success, error}` y silencios vacíos.

(Previously: mix de éxito/error y fail-open — hallazgo C4)

#### Scenario: Error propagado

- GIVEN un fallo en una query de datos
- WHEN ocurre
- THEN la capa lanza un error capturable por un boundary único, sin `{}` silencioso