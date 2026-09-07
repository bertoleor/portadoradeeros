-- ==============================================================
-- CANONICAL SCHEMA — Portadora de Eros (ref xvwmngtdzuzfnqelcjzf)
-- ==============================================================
-- Single source of truth for the PUBLIC schema, snapshot of the LIVE
-- database (post Slice-1 RLS/allowlist). Generated 2026-09-06 by
-- reading information_schema from the live Supabase project — NOT by
-- re-running legacy DDL.
--
-- This file DOES NOT need to be re-run against the live DB (it already
-- matches). It exists so a clean environment can be reproduced and so
-- drift is detectable. Every statement is idempotent (IF NOT EXISTS /
-- guarded).
--
-- Real tables (8): services, appointments, blocked_times, clients,
--                  contact_messages, admin_settings, admin_users,
--                  push_subscriptions.
--
-- See migrations/README.md for the lineage and the list of LEGACY files.
-- ==============================================================

-- ---------------------------------------------------------------
-- services
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
    id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug              TEXT UNIQUE NOT NULL,
    title             TEXT NOT NULL,
    short_description TEXT NOT NULL,
    description       TEXT,
    price             INTEGER NOT NULL DEFAULT 0,
    duration          INTEGER NOT NULL DEFAULT 60,
    is_visible        BOOLEAN DEFAULT false,
    icon              TEXT DEFAULT 'sparkles',
    images            TEXT[] DEFAULT '{}',
    created_at        TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at        TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    surname    TEXT,
    email      TEXT,
    phone      TEXT,
    notes      TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email)
    WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone)
    WHERE phone IS NOT NULL;
-- D4: uniqueness backing findClient's .single() on email
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_email_unique
    ON public.clients(email) WHERE email IS NOT NULL;

-- ---------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id       UUID REFERENCES public.services(id) ON DELETE SET NULL,
    client_name      TEXT NOT NULL,
    client_email     TEXT NOT NULL,
    client_phone     TEXT,
    appointment_date TIMESTAMPTZ NOT NULL,
    notes            TEXT,
    status           TEXT DEFAULT 'pending' CHECK (
        status IN ('pending', 'confirmed', 'cancelled', 'completed')
    ),
    google_event_id  TEXT,
    client_id        UUID REFERENCES public.clients(id),
    created_at       TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at       TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- D3: hot-path range queries for the calendar/slot computation
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_date
    ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id
    ON public.appointments(client_id);

-- ---------------------------------------------------------------
-- blocked_times
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blocked_times (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT,
    date        DATE NOT NULL,
    time_start  TIME,
    time_end    TIME,
    is_all_day  BOOLEAN DEFAULT false,
    type        TEXT NOT NULL DEFAULT 'blocked' CHECK (
        type IN ('blocked', 'occupied', 'event')
    ),
    color       TEXT DEFAULT '#ef4444',
    created_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_blocked_times_date ON public.blocked_times(date);

-- ---------------------------------------------------------------
-- contact_messages
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    phone      TEXT,
    message    TEXT NOT NULL,
    status     TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---------------------------------------------------------------
-- admin_settings (single row, id = 1)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id                SMALLINT PRIMARY KEY CHECK (id = 1),
    instagram_url     TEXT,
    whatsapp_url      TEXT,
    contact_email     TEXT,
    bio_content       TEXT,
    business_hours    JSONB,
    profile_image_url TEXT,
    site_url          TEXT DEFAULT '',
    tiktok_url        TEXT DEFAULT '',
    admin_name        TEXT DEFAULT 'Jacque',
    admin_avatar_url  TEXT DEFAULT '',
    bank_owner        TEXT DEFAULT 'Jacqueline',
    bank_cbu          TEXT DEFAULT '',
    bank_alias        TEXT DEFAULT '',
    bank_name         TEXT DEFAULT '',
    updated_at        TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---------------------------------------------------------------
-- admin_users (authorization allowlist — Slice 1)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email      TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------
-- push_subscriptions
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint   TEXT NOT NULL UNIQUE,
    p256dh     TEXT NOT NULL,
    auth       TEXT NOT NULL,
    admin_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================
-- RLS & POLICIES are managed by migration_security_rls_allowlist.sql
-- (Slice 1) and are intentionally NOT reproduced here. The canonical
-- RLS source of truth is:
--   migrations/migration_security_rls_allowlist.sql
-- ==============================================================