// Single source of truth for services / business settings (C5).
//
// The hardcoded `SERVICES`, `TIME_SLOTS` and `DEFAULT_BUSINESS_SETTINGS`
// fallbacks previously defined here were dead weight: services come from the
// Supabase `services` table via `src/lib/api/services.ts` (getVisibleServices /
// getServices / getServiceBySlug), and business settings come from the `admin_settings`
// single row via `src/lib/api/settings.ts` (getAdminSettings). Admin auth is
// handled by Supabase Auth + the `admin_users` allowlist (Slice 1), not by any
// configuration constant.