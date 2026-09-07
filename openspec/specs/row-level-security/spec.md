# row-level-security Specification

## Purpose

Habilitar Row Level Security con políticas mínimas sobre `clients`, `appointments` y `blocked_times`, de modo que un anónimo no pueda leer ni escribir PII, ni adulterar el campo `status` de una reserva.

## Requirements

### Requirement: RLS habilitada en tablas PII

RLS MUST estar habilitada en `clients`, `appointments` y `blocked_times`. Las políticas MUST negar SELECT/INSERT/UPDATE/DELETE a roles anónimos sobre `clients`, y MUST negar toda escritura (INSERT/UPDATE/DELETE) anónima sobre `blocked_times`. `blocked_times` expone únicamente horarios de indisponibilidad de agenda (no PII), por lo que su lectura pública es intencional para el cálculo de disponibilidad en la página pública.

(Previously: RLS inoperante — hallazgo S1)

#### Scenario: Anónimo lee clients

- GIVEN una solicitud anónima contra `clients`
- WHEN intenta SELECT
- THEN recibe 0 filas (política deniega acceso)

#### Scenario: Anónimo lee bloqueos de agenda

- GIVEN una solicitud anónima contra `blocked_times`
- WHEN intenta SELECT
- THEN recibe las filas de bloqueo de agenda (lectura pública de disponibilidad, no PII — ver design D-SEC/Rollout paso 2)

#### Scenario: Anónimo escribe bloqueos de agenda

- GIVEN una solicitud anónima contra `blocked_times`
- WHEN intenta INSERT/UPDATE/DELETE
- THEN recibe 0 filas / es denegado (solo admin con `is_admin()` puede escribir)

### Requirement: Status de reserva pública restringido

El INSERT público de reservas MUST aceptar únicamente `status = 'pending'` desde una sesión anónima. Cualquier otro valor (`confirmed`, `cancelled`, etc.) MUST ser rechazado o forzado a `pending`, sin permitir adulterar el estado.

(Previously: anon podía setear `status` arbitrario — hallazgo S6)

#### Scenario: Reserva pública con status legítimo

- GIVEN una solicitud anónima de reserva con `status='pending'`
- WHEN se INSERTA
- THEN la reserva se crea con `status='pending'`

#### Scenario: Reserva pública con status adulterado

- GIVEN una solicitud anónima con `status='confirmed'`
- WHEN se INSERTA
- THEN el valor es rechazado o forzado a `pending`, nunca `confirmed`