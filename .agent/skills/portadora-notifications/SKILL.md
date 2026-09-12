---
name: portadora-notifications
description: >
  EmailJS + web-push notification conventions for portadora-eros (booking/contact/adm).
  Trigger: when adding or editing EmailJS sends or web-push in this repo.
license: Apache-2.0
metadata:
  author: portadora-eros
  version: "1.0"
---

# Notifications — portadora-eros

Source: `src/lib/email.ts`, `src/app/api/admin/push/subscribe/route.ts`,
`src/lib/api/appointments.ts` (`sendPushToAdmins`). Stack: `@emailjs/nodejs` + `web-push`.

## Email (EmailJS)

- Templates are selected by env var with a hardcoded fallback ID
  (`process.env.EMAILJS_TEMPLATE_* || 'template_...'`).
- One admin inbox: `ADMIN_EMAIL = 'portadoradeeros@gmail.com'`.
- Three template params drive the UI: `clientName`, `service`, `date`, `time`,
  `to_email`; admin notifications overload `service` with client info
  (`"${service} - ${clientName} (${clientPhone})"`).

### Exported senders (src/lib/email.ts)

- `sendAppointmentConfirmation` — "pendiente" email to client on booking.
- `sendNewAppointmentNotification` — to admin on new request.
- `sendContactFormNotification(name, email, message)` — contact form → admin.
- `sendAppointmentConfirmed` / `sendAppointmentReminder` / `sendAppointmentCancellation`.

## Web-Push

- VAPID configured globally once in `appointments.ts` from
  `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY`.
- Subscriptions stored in `push_subscriptions` (`admin_id`, `endpoint`, `p256dh`,
  `auth`), upserted on `endpoint` conflict.
- Broadcast reads subscriptions through `createAdminClient` (service-role, RLS
  bypass) because `push_subscriptions` RLS is `auth.uid() = admin_id`.

## MUST

- MUST never let notification failures abort the booking mutation — wrap sends in
  `try/catch` and log, returning the booking `Result` regardless.
- MUST fire push with `void sendPushToAdmins(...)` (fire-and-forget) so it never
  blocks the response.
- MUST clean up expired push subscriptions: on `410`/`404` from
  `webPush.sendNotification`, delete that subscription row.
- MUST select ONLY `push_subscriptions` rows (endpoint/keys) via the admin client
  — never PII.

## SHOULD

- SHOULD format dates with `Intl.DateTimeFormat('es-AR', { dateStyle: 'full',
  timeStyle: 'short', timeZone: 'America/Argentina/Buenos_Aires' })` before
  templating emails.
- SHOULD flag `emailSent`/`adminNotificationSent` booleans in the API response
  (they are informational; a failed email must not 500 the endpoint).

## NEVER

- Never `await sendPushToAdmins(...)` blocking the booking path — use `void`.
- Never let a push/web-push failure mark the booking as failed.
- Never read PII columns through the admin/service client that broadcasts push.

## Examples

### ✅ Fire-and-forget push

```typescript
void sendPushToAdmins({
  title: 'Nuevo turno ✨',
  body: `${payload.clientName} agendó ${payload.serviceName}.`,
  url: '/admin',
});
```

### ✅ Expired-subscription cleanup

```typescript
return webPush.sendNotification(pushConfig, JSON.stringify(payload)).catch(err => {
  if (err.statusCode === 410 || err.statusCode === 404) {
    return supabase.from('push_subscriptions').delete().eq('id', sub.id);
  }
  console.error('Push error for sub:', sub.id, err);
});
```

### ✅ Email send is best-effort

```typescript
try {
  await sendNewAppointmentNotification(emailData);
  await sendAppointmentConfirmation(emailData);
} catch (err) {
  console.error('Email error:', err); // do NOT throw — booking already stored
}
```