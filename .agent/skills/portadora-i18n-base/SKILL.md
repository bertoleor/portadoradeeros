---
name: portadora-i18n-base
description: >
  Base i18n/locale conventions for portadora-eros (es-AR, dates, timezone).
  Trigger: when writing Spanish UI copy, dates, numbers, or timezone handling in this repo.
license: Apache-2.0
metadata:
  author: portadora-eros
  version: "1.0"
---

# i18n Base — portadora-eros

Source: the repo's copy, `src/lib/api/appointments.ts` date formatting, and the
`i18n-es-ar` skill (voseo ui copy). The app targets a single locale: **es-AR**
(Rioplatense Spanish) with `America/Argentina/Buenos_Aires` timezone.

## MUST

- MUST render all user-facing copy in rioplatense Spanish with **voseo**
  imperatives (`elegí`, `calculá`, `agendá`) — never `tú` forms.
  Full voseo rules in the `i18n-es-ar` skill.
- MUST format dates/times with `Intl.DateTimeFormat('es-AR', { ... })` — never
  hand-rolled `toLocaleDateString` without a locale argument.
- MUST pin the timezone to `America/Argentina/Buenos_Aires` when formatting a
  stored `Date` so admin and client see the same wall-clock time.
- MUST give user-facing error/validation messages in the schema handlers in
  Spanish (e.g. `'Nombre requerido'`, `'Email inválido'`).

## SHOULD

- SHOULD reuse the canonical `Intl.DateTimeFormat('es-AR', { dateStyle: 'full',
  timeStyle: 'short', timeZone: 'America/Argentina/Buenos_Aires' })` block found
  in `appointments.ts` rather than inventing a new formatter per file.
- SHOULD keep `'a las'` as the date/time separator when splitting formatted
  strings (`formattedDate.split(' a las ')`) — it matches the es-AR output.
- SHOULD store dates as ISO strings (`toISOString()`) in the DB and Localize only
  at the presentation boundary.

## NEVER

- Never format a date with default `toLocaleDateString()` (no `'es-AR'`).
- Never use `tú` verb forms in UI copy (voseo wins).
- Never mix timezones: always pass `timeZone: 'America/Argentina/Buenos_Aires'`
  for business-facing datetimes.
- Never hardcode English messages in handlers/forms.

## Canonical date formatter

```typescript
const formattedDate = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'full',
  timeStyle: 'short',
  timeZone: 'America/Argentina/Buenos_Aires',
}).format(new Date(appointment.appointment_date));

// split for separate date/time fields used by email templates
const date = formattedDate.split(' a las ')[0];
const time = formattedDate.split(' a las ')[1] || '';
```

## Examples

### ✅ Voseo copy

```typescript
'Elegí el servicio que querés.'; // voseo
'Debés iniciar sesión como administrador.'; // from requireAdmin
```

### ❌ Wrong

```typescript
'Elige el servicio que quieres.'; // tuteo — wrong locale/verb
new Date(d).toLocaleDateString(); // no locale — wrong
```