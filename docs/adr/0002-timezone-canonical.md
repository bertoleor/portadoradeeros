# ADR-0002 — Zona horaria canónica del flujo de reservas: ART wall-clock

> **Búsqueda:** keywords:
> `timezone, ART, wall-clock, UTC, ADR-0002, getBookedSlots, booking, EROS-D1, canonica` ·
> clasificación: `adr` · estado: canónico · actualizado: 2026-10-02

## Estado

Aceptada (2026-10-02) — cierra el hallazgo EROS-D1 (P2, t_c8d9bdfa, auditoría 2026-09-30 de
34-auditor).

## Contexto

EROS es un negocio con clientela en Argentina que opera en horario comercial 9-18 ART. El flujo
público de reservas intercambia valores de fecha/hora en varias puntas:

- `getBookedSlots(dateStr)` (server) → array de strings `"HH:mm"` ocupados
- `CustomTimePicker` (client) → compara esos strings contra la hora elegida
- `ServiceContactForm` (client) → construye el `Date` a submitir
- `getNextAvailableSlots` (server) → slots sugeridos `{date,time,datetime}`
- `blocked_times` (DB) → `date "YYYY-MM-DD"` + `time_start/time_end "HH:mm"`
- `business_hours` (DB/settings) → `"HH:mm"` por día de semana

El hallazgo EROS-D1: `getBookedSlots` etiquetaba los slots con `getUTCHours()/getUTCMinutes()` (UTC)
mientras el picker compara hora local ART, y el form submitía `new Date(y, m-1, d, hh, mm)` en la TZ
local del navegador. En Argentina (UTC-3) toda marca "Reservado" quedaba corrida 3 horas: un turno
real de 15:00 bloqueaba el slot 18:00 y dejaba libre el 15:00. El guard server-side anti-overbooking
compara absolutos, así que no había doble-booking — pero el cliente elegía horarios que parecían
libres y recién al confirmar recibía "Ese horario acaba de ocuparse".

## Decisión

**Una sola zona horaria canónica para todo el flujo público: ART (America/Argentina/Buenos_Aires,
UTC-3 fijo, sin DST desde 2009).**

1. Todo string `"HH:mm"` o `"YYYY-MM-DD"` intercambiado entre server y client es wall-clock ART.
   Incluye labels de slots ocupados, opciones del picker, business hours, blocked times y el dateStr
   del calendar.

2. Los absolutos (epoch ms / ISO instant) son lo único que se compara, persiste o guarda en DB
   (`appointment_date` sigue siendo un instant).

3. La conversión wall-clock↔instant vive en UN módulo: `src/lib/timezone.ts` (helpers
   `BUSINESS_TIME_ZONE`, `zonedWallClockMs`, `formatWallClockHHmm`, `zonedDateStr`, `artDayBounds`).
   JAMÁS hardcodear la zona ni usar `getUTCHours`/`new Date(y,m,d,hh,mm)` para el flujo de reservas.

4. La ventana de query por día es el día ART completo (`artDayBounds` → `[03:00Z, +24h)`), no el día
   UTC: un turno 22:00 ART (01:00Z del día UTC siguiente) pertenece al día ART en que se reservó.

## Justificación de ART (y no UTC end-to-end)

- El picker, las business hours y los blocked times son wall-clock por diseño de producto (horario
  comercial 9-18 ART); re-canonizarlos a UTC tocaría cada consumidor con riesgo de drift nuevo.
- ART ya es el estándar de presentación en todos los paths de email y reminders (4×
  `Intl.DateTimeFormat(..., { timeZone: 'America/Argentina/ Buenos_Aires' })` en appointments.ts +
  reminders route).
- Argentina no tiene DST desde 2009 → offset fijo, aritmética estable.

## Consecuencias

- `getBookedSlots` consulta el día ART y etiqueta en ART (via `booking-slots.ts`, lógica pura
  testeable sin Supabase).
- `getNextAvailableSlots` camina días ART desde el "hoy" ART de `now`.
- `ServiceContactForm.handleSubmit` construye el instant con `zonedWallClockMs(date, time)` —
  correcto también para clientes fuera de UTC-3 (la TZ del navegador deja de importar).
- `checkSlotAvailability` (guard anti-overbooking) queda intocado: compara absolutos y era correcto.
- Tests TZ-invariantes: toda aserción es sobre instantes UTC absolutos o strings fijos, no sobre
  horas locales del runner.

## Cumplimiento

- `src/lib/timezone.ts` + `timezone.test.ts` (11 tests, verdes en TZ=UTC, TZ=ART y TZ local del
  host).
- `src/lib/booking-slots.ts` + `booking-slots.test.ts` (13 tests): pinnean que un turno 15:00 ART
  bloquea exactamente "15:00" (no "18:00") y que el día ART captura un 22:00 ART cuyo instant UTC
  cae al día siguiente.
- `getBookedSlots`/`getNextAvailableSlots` rewired; form submit canónico.
