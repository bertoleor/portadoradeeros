import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

/**
 * Anonymous (anon-key) server read client — SERVER-ONLY, cookie-free.
 *
 * Unlike `src/lib/supabase/server.ts`, this client does NOT read `cookies()`,
 * so it can be used inside `unstable_cache` (static data cache) without
 * forcing the request into dynamic rendering. It still goes through the `anon`
 * Postgres role, so RLS applies exactly as for a public visitor — services are
 * filtered to `is_visible = true` and `admin_settings`/`blocked_times` are
 * public-read by design (Slice 1).
 *
 * Use this ONLY for role-independent public reads. Never use it for queries
 * whose result depends on the authenticated user.
 */
export function createReadClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}