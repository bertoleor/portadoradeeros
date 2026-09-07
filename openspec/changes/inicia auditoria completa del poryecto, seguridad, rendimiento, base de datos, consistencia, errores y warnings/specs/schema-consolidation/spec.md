# schema-consolidation Specification

## Purpose

Establecer las migraciones Supabase como única fuente de verdad del schema, garantizar que `messages` y `settings` existen en la BD viva, resolver las 7 migraciones solapadas, añadir el índice de `appointment_date` y regenerar los tipos TS de Database.

## Requirements

### Requirement: Migraciones como fuente única

El schema MUST definirse en migraciones Supabase (una sola fuente de verdad), consolidando las 7 migraciones solapadas existentes. Los tipos `Database` TS MUST generarse a partir de ese schema, no mantenerse a mano.

(Previously: 7 migraciones solapadas + tipos a mano — hallazgos D1/D2)

#### Scenario: Schema reproducible

- GIVEN una base limpia
- WHEN se aplican las migraciones consolidadas
- THEN el schema resultante coincide con el de producción, sin drift

#### Scenario: Tipos generados

- GIVEN el schema consolidado
- WHEN se regeneran los tipos
- THEN `src/lib/supabase` tipa las tablas/columnas reales

### Requirement: Tablas messages y settings existen

Las tablas `messages` y `settings` MUST existir en la BD viva, de modo que el admin UI deje de devolver 404.

(Previously: no existen → 404 — hallazgo D1)

#### Scenario: Admin UI carga sin 404

- GIVEN `messages` y `settings` creadas
- WHEN el admin abre sus vistas
- THEN cargan sin error 404

### Requirement: Índice appointment_date

La columna `appointments.appointment_date` MUST tener un índice para soportar queries de rango de agenda.

(Previously: sin índice — hallazgo D3)

#### Scenario: Query de rango indexado

- GIVEN el índice existe
- WHEN se consulta disponibilidad por rango de fechas
- THEN la query usa el índice (plan de ejecución indexado)

### Requirement: Unique constraint email

La columna `clients.email` SHOULD tener un constraint de unicidad para respaldar la búsqueda por `findClient`.

(Previously: sin garantía de unicidad — hallazgo D4)

#### Scenario: Email duplicado rechazado

- GIVEN un email ya registrado
- WHEN se intenta insertar otro cliente con el mismo email
- THEN la base lo rechaza por unicidad