import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));

vi.mock('@/lib/supabase/server', () => ({ createClient }));

import { AppError } from '@/lib/api/error';

import { requireAdmin } from './requireAdmin';

describe('requireAdmin (D-SEC-3 auth guard)', () => {
  beforeEach(() => {
    createClient.mockReset();
  });

  it('rejects an anonymous session with UNAUTHORIZED', async () => {
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      rpc: vi.fn(),
    });

    await expect(requireAdmin()).rejects.toMatchObject({
      name: 'AppError',
      code: 'UNAUTHORIZED',
      message: 'Debés iniciar sesión como administrador.',
    });
  });

  it('rejects when the session lookup errors', async () => {
    createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('network') }),
      },
      rpc: vi.fn(),
    });

    await expect(requireAdmin()).rejects.toBeInstanceOf(AppError);
  });

  it('rejects an authenticated user not in the admin allowlist', async () => {
    const user = { id: 'user-123', email: 'user@x.com' };
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
      rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
    });

    await expect(requireAdmin()).rejects.toMatchObject({
      name: 'AppError',
      code: 'UNAUTHORIZED',
      message: 'No tenés permisos de administrador.',
    });
  });

  it('rejects when the is_admin RPC errors', async () => {
    const user = { id: 'user-123', email: 'admin@x.com' };
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
      rpc: vi.fn().mockResolvedValue({ data: null, error: new Error('rpc down') }),
    });

    await expect(requireAdmin()).rejects.toBeInstanceOf(AppError);
  });

  it('returns the authenticated user when is_admin is true', async () => {
    const user = { id: 'user-123', email: 'admin@x.com' };
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
      rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
    });

    await expect(requireAdmin()).resolves.toBe(user);
  });

  it('calls the is_admin RPC predicate (same rule as RLS)', async () => {
    const user = { id: 'user-123', email: 'admin@x.com' };
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
      rpc,
    });

    await requireAdmin();
    expect(rpc).toHaveBeenCalledWith('is_admin');
  });
});
