import { createClient } from '@/lib/supabase/server';
import { AppError } from '@/lib/api/error';

/**
 * Server-side authorization guard (defense-in-depth, D-SEC-3).
 *
 * Verifies the current session is authenticated AND that the user's UID is in
 * the `admin_users` allowlist via the `is_admin()` Postgres function — the SAME
 * predicate enforced by RLS, so authorization cannot drift between the app and
 * the database.
 *
 * Throws `AppError('UNAUTHORIZED')` when the caller is anonymous or not in the
 * allowlist. Returns the authenticated `user` on success.
 */
export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new AppError('UNAUTHORIZED', 'Debés iniciar sesión como administrador.');
  }

  const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin');

  if (rpcError || isAdmin !== true) {
    throw new AppError('UNAUTHORIZED', 'No tenés permisos de administrador.');
  }

  return user;
}