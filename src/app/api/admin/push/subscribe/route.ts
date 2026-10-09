import { NextResponse } from 'next/server';

import { AppError } from '@/lib/api/error';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    // AUTHORIZATION (EROS-D3) — same `is_admin()` allowlist predicate the RLS
    // policies enforce, checked in the app layer like every other admin
    // write. An authenticated non-admin is rejected here instead of relying
    // on the database to refuse the upsert. `requireAdmin` revalidates the
    // session server-side via getUser() (getSession() is deprecated and does
    // not revalidate against the auth server).
    const user = await requireAdmin();

    const subscription = await request.json();

    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    // Save or update subscription
    const supabase = await createClient();
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        admin_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      { onConflict: 'endpoint' }
    );

    if (error) {
      console.error('Error saving push subscription:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AppError && error.code === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Unexpected error in push subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
