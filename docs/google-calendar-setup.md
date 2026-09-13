# Google Calendar — setup de sincronización de turnos

La admin ve sus turnos confirmados en su Google Calendar. La app crea/actualiza/borra
eventos automáticamente (best-effort: si Google falla, el turno igual se guarda y se
loguea el error).

## Comportamiento

| Acción | Efecto en Google Calendar |
|---|---|
| Admin confirma un turno (`pending` → `confirmed`) | Crea el evento (o actualiza si ya existía) y guarda `appointments.google_event_id` |
| Turno completado | Actualiza el evento existente (o lo crea si no tiene) |
| Turno cancelado | Borra el evento y limpia `google_event_id` |
| Turno creado por admin (nace `confirmed`) | Crea el evento al momento |
| Turno borrado (hard delete) | Borra el evento |
| Reserva pública (nace `pending`) | **No** sincroniza hasta que la admin lo confirme |

## 1. Crear credenciales OAuth2 (una vez)

1. Ir a [Google Cloud Console](https://console.cloud.google.com/) → crear o elegir proyecto.
2. **APIs y servicios → Biblioteca** → habilitar **Google Calendar API**.
3. **APIs y servicios → Pantalla de consentimiento OAuth**:
   - Tipo: Externo, completar nombre/app/email.
   - Agregar scope `.../auth/calendar` (o `calendar.events`).
   - Agregar la cuenta Gmail de la admin como **usuario de prueba**.
4. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente OAuth**:
   - Tipo: **Aplicación web**.
   - Origen autorizado: `http://localhost:3000` (y la URL de producción).
   - URI de redirección: `http://localhost:3000/api/auth/callback/google` (solo se usa
     para el intercambio inicial; en producción no hace falta endpoint propio).
5. Copiar **Client ID** y **Client Secret** → `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

## 2. Obtener el refresh token (una vez)

Opción rápida con [OAuth 2.0 Playground](https://developers.google.com/oauthplayground):

1. Arriba a la derecha (⚙️): marcar **"Use your own OAuth credentials"** y pegar
   Client ID + Client Secret.
2. En la lista de scopes, elegir **Calendar API v3 → `https://www.googleapis.com/auth/calendar`**
   (o `calendar.events`) → **Authorize APIs**.
3. Iniciar sesión con la cuenta de la admin y aceptar.
4. **Exchange authorization code for tokens** → copiar el **Refresh token**.
5. Pegarlo en `GOOGLE_REFRESH_TOKEN` (local `.env.local`, y en Vercel → Settings →
   Environment Variables para producción).

> El refresh token es un secreto como una contraseña: nunca commitearlo.
> Si se revoca (se cambia la clave del proyecto o se quita el acceso), repetir este paso.

## 3. Variables de entorno

```bash
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxx
GOOGLE_REFRESH_TOKEN=1//xxxx
GOOGLE_CALENDAR_ID=primary   # o el email de un calendario secundario
GOOGLE_CALENDAR_TIMEZONE=America/Argentina/Buenos_Aires
```

Sin `GOOGLE_REFRESH_TOKEN` la app funciona igual (emails + panel admin); la
sincronización queda desactivada (`isGoogleCalendarConfigured() === false`).

## 4. Verificar

- Tests con mocks (sin credenciales reales): `npx vitest run src/lib/google-calendar.test.ts`
- Typecheck: `npm run typecheck`
- Manual: configurar las vars en `.env.local`, confirmar un turno desde `/admin` y
  verificar que aparezca el evento en el calendario de la admin.

## Archivos

- `src/lib/google-calendar.ts` — cliente OAuth2 + `createCalendarEvent` /
  `updateCalendarEvent` / `deleteCalendarEvent` / `upsertAppointmentEvent`.
- `src/lib/api/appointments.ts` — hooks en `confirmAppointment`, `completeAppointment`,
  `cancelAppointment`, `createAppointmentAdmin`, `deleteAppointment`.
- `src/lib/google-calendar.test.ts` — 14 tests con `fetch` mockeado.
