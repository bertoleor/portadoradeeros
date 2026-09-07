import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * PRIVILEGED (service-role) Supabase client — SERVER-ONLY.
 *
 * This client authenticates with the `SUPABASE_SERVICE_ROLE_KEY` and BYPASSES
 * Row-Level Security. It MUST:
 *   - Never be imported into a client component or a `'use client'` module.
 *   - Never select columns containing PII (client_name/client_email/client_phone)
 *     and return them to the browser.
 *
 * Its ONLY current legitimate uses are read-only slot-availability queries on
 * `appointments` that RLS now denies to the anon role (Slice 1), selecting a
 * sanitized, non-PII column set (appointment_date, service_id, status).
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase service-role credentials are not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).'
    );
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}