-- Google Calendar sync: link appointments to calendar events.
-- Idempotent: safe to re-run.
alter table public.appointments
  add column if not exists google_event_id text;
