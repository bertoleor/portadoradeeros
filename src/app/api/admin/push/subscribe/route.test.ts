import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));

vi.mock('@/lib/supabase/server', () => ({ createClient }));

import { POST } from './route';

const VALID_SUBSCRIPTION = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
  keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
};

interface SupabaseMockOptions {
  user: unknown;
  isAdmin?: boolean;
  upsertError?: Error | null;
}

function mockSupabase({ user, isAdmin, upsertError }: SupabaseMockOptions) {
  const getSession = vi.fn();
  const upsert = vi.fn().mockResolvedValue({ error: upsertError ?? null });
  const from = vi.fn().mockReturnValue({ upsert });

  createClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
      getSession,
    },
    rpc: vi.fn().mockResolvedValue({ data: isAdmin, error: null }),
    from,
  });

  return { getSession, upsert, from };
}

function postSubscription(payload: unknown) {
  return POST(
    new Request('http://localhost:3000/api/admin/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  );
}

describe('POST /api/admin/push/subscribe (EROS-D3: admin gate + getUser)', () => {
  beforeEach(() => {
    createClient.mockReset();
  });

  it('rejects an anonymous caller with 401 and never touches push_subscriptions', async () => {
    const { from } = mockSupabase({ user: null });

    const res = await postSubscription(VALID_SUBSCRIPTION);

    expect(res.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it('rejects an authenticated non-admin with 401 and never touches push_subscriptions', async () => {
    const { from } = mockSupabase({ user: { id: 'user-123' }, isAdmin: false });

    const res = await postSubscription(VALID_SUBSCRIPTION);

    expect(res.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it('saves the subscription for an allowlisted admin, keyed by that admin', async () => {
    const { upsert } = mockSupabase({ user: { id: 'admin-1' }, isAdmin: true });

    const res = await postSubscription(VALID_SUBSCRIPTION);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        admin_id: 'admin-1',
        endpoint: VALID_SUBSCRIPTION.endpoint,
        p256dh: VALID_SUBSCRIPTION.keys.p256dh,
        auth: VALID_SUBSCRIPTION.keys.auth,
      }),
      { onConflict: 'endpoint' }
    );
  });

  it('validates the payload before the upsert: 400 when endpoint is missing', async () => {
    mockSupabase({ user: { id: 'admin-1' }, isAdmin: true });

    const res = await postSubscription({ keys: { p256dh: 'k', auth: 'a' } });

    expect(res.status).toBe(400);
  });

  it('maps an upsert failure to 500 without leaking the DB error', async () => {
    mockSupabase({
      user: { id: 'admin-1' },
      isAdmin: true,
      upsertError: new Error('rls violation 42501'),
    });

    const res = await postSubscription(VALID_SUBSCRIPTION);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Database error' });
  });

  it('authenticates with getUser() (revalidated server-side), never the deprecated getSession()', async () => {
    const { getSession } = mockSupabase({ user: { id: 'admin-1' }, isAdmin: true });

    await postSubscription(VALID_SUBSCRIPTION);

    expect(getSession).not.toHaveBeenCalled();
  });
});
