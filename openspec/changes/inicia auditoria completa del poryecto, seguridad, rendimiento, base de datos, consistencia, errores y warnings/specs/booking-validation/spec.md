# booking-validation Specification

## Purpose

Validar con zod los endpoints públicos de reservas y contacto, y añadir guard de sesión (defensa en profundidad) en las acciones de servidor más allá de RLS.

## Requirements

### Requirement: Validación zod en endpoints públicos

Los endpoints públicos `contact` y `appointments` MUST validar sus payloads con esquemas zod antes de procesarlos, rechazando entradas inválidas.

(Previously: sin validación de entrada — hallazgo S7)

#### Scenario: Payload inválido

- GIVEN una solicitud pública con campos faltantes o mal tipados
- WHEN llega al endpoint
- THEN es rechazada con error de validación y NO se procesa

#### Scenario: Payload válido

- GIVEN una solicitud pública con esquema correcto
- WHEN llega al endpoint
- THEN se procesa y devuelve éxito

### Requirement: Guard de sesión en acciones server

Las acciones de servidor que mutan reservas/contacto MUST verificar autenticación/autorización además de RLS (defensa en profundidad), denegando anónimos o no autorizados.

(Previously: solo RLS, sin guard — hallazgo S2, relacionado S6)

#### Scenario: Acción sin sesión

- GIVEN una acción server sin sesión autenticada
- WHEN se invoca
- THEN es rechazada antes de tocar datos, pese a que RLS exista

### Requirement: Status de reserva solo pending desde anon

El flujo público de reserva MUST fijar/validar `status='pending'` en el servidor, sin confiar en el valor enviado por el cliente.

(Previously: cliente podía fijar status — hallazgo S6)

#### Scenario: Status forzado a pending

- GIVEN una reserva pública
- WHEN se procesa
- THEN el status se fuerza a `pending` independiente del valor enviado