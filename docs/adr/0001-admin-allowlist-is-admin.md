# ADR-0001 — Autorización admin por allowlist `is_admin()`

- **Fecha:** 2026-09-12 | **Estado:** aceptado (documenta lo existente, UNVERIFIED)
- **Contexto:** sitio monolingüe es-AR con un área `/admin` de un solo operador. Supabase Auth con signup público deshabilitado.
- **Decisión:** la autorización vive en la tabla `public.admin_users` + función SQL `is_admin()`, usada a la vez por las policies RLS y por el guard server `requireAdmin()` (mismo predicado en DB y app → sin drift).
- **Consecuencias:** agregar un admin = insertar UID en `admin_users`; ningún env controla roles; `SUPABASE_SERVICE_ROLE_KEY` solo server y acotada a push.
- **Alternativas descartadas:** rol por `auth.role()` genérico (demasiado amplio), env `ADMIN_EMAILS` (drift con RLS).
