import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  buildCalendarEventBody,
  buildEventBody,
  createCalendarEvent,
  deleteCalendarEvent,
  getAppointmentEndIso,
  getGoogleAccessToken,
  isGoogleCalendarConfigured,
  shouldSyncStatus,
  updateCalendarEvent,
  upsertAppointmentEvent,
} from './google-calendar';

const SAVED_ENV = { ...process.env };

function setGoogleEnv(): void {
  process.env.GOOGLE_CLIENT_ID = 'test-client-id';
  process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
  process.env.GOOGLE_REFRESH_TOKEN = 'test-refresh-token';
}

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(payload),
    text: () => Promise.resolve(JSON.stringify(payload)),
  } as Response;
}

beforeEach(() => {
  setGoogleEnv();
  delete process.env.GOOGLE_CALENDAR_ID;
  delete process.env.GOOGLE_CALENDAR_TIMEZONE;
});

afterEach(() => {
  process.env = { ...SAVED_ENV };
});

describe('isGoogleCalendarConfigured', () => {
  it('returns true when all three vars are set', () => {
    expect(isGoogleCalendarConfigured()).toBe(true);
  });

  it('returns false when the refresh token is missing', () => {
    delete process.env.GOOGLE_REFRESH_TOKEN;
    expect(isGoogleCalendarConfigured()).toBe(false);
  });
});

describe('shouldSyncStatus', () => {
  it.each(['confirmed', 'completed'])('syncs %s', (status) => {
    expect(shouldSyncStatus(status)).toBe(true);
  });

  it.each(['pending', 'cancelled', null, undefined, ''])('does not sync %s', (status) => {
    expect(shouldSyncStatus(status)).toBe(false);
  });
});

describe('getAppointmentEndIso', () => {
  it('adds the duration to the start', () => {
    expect(getAppointmentEndIso('2026-09-20T14:00:00.000Z', 60)).toBe(
      '2026-09-20T15:00:00.000Z'
    );
  });

  it('falls back to 60min for invalid durations', () => {
    expect(getAppointmentEndIso('2026-09-20T14:00:00.000Z', 0)).toBe(
      '2026-09-20T15:00:00.000Z'
    );
  });
});

describe('buildCalendarEventBody', () => {
  it('builds summary, window and attendees', () => {
    const body = buildCalendarEventBody({
      clientName: 'Ana López',
      clientEmail: 'ana@example.com',
      clientPhone: '+5491100000000',
      serviceName: 'Lectura de Tarot',
      appointmentDateIso: '2026-09-20T14:00:00.000Z',
      durationMinutes: 90,
      notes: 'Primera sesión',
      status: 'confirmed',
    });
    expect(body.summary).toBe('Lectura de Tarot — Ana López');
    expect(body.start.dateTime).toBe('2026-09-20T14:00:00.000Z');
    expect(body.end.dateTime).toBe('2026-09-20T15:30:00.000Z');
    expect(body.attendees).toEqual([{ email: 'ana@example.com' }]);
    expect(body.description).toContain('Ana López');
    expect(body.description).toContain('Primera sesión');
  });
});

describe('buildEventBody', () => {
  it('maps explicit input with default timezone', () => {
    const body = buildEventBody({
      summary: 'Test',
      startIso: '2026-09-20T14:00:00.000Z',
      endIso: '2026-09-20T15:00:00.000Z',
    });
    expect(body.start.timeZone).toBe('America/Argentina/Buenos_Aires');
    expect(body.end.dateTime).toBe('2026-09-20T15:00:00.000Z');
  });
});

describe('getGoogleAccessToken', () => {
  it('exchanges the refresh token for an access token', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ access_token: 'ya29.test', expires_in: 3600 })
    );
    const token = await getGoogleAccessToken({ fetchImpl: fetchMock as unknown as typeof fetch });
    expect(token).toBe('ya29.test');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstCall = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const url = firstCall[0];
    const init = firstCall[1];
    expect(url).toContain('oauth2.googleapis.com/token');
    expect(String(init.body)).toContain('grant_type=refresh_token');
  });

  it('throws when env is not configured', async () => {
    delete process.env.GOOGLE_REFRESH_TOKEN;
    const fetchMock = vi.fn();
    await expect(
      getGoogleAccessToken({ fetchImpl: fetchMock as unknown as typeof fetch })
    ).rejects.toThrow(/not configured/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws on a token endpoint error', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ error: 'invalid_grant' }, 400)
    );
    await expect(
      getGoogleAccessToken({ fetchImpl: fetchMock as unknown as typeof fetch })
    ).rejects.toThrow(/token refresh failed/);
  });
});

describe('createCalendarEvent', () => {
  it('posts the event body and returns the id', async () => {
    const calls: { url: string; method: string }[] = [];
    const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), method: init?.method ?? 'GET' });
      if (String(url).includes('oauth2.googleapis.com')) {
        return jsonResponse({ access_token: 'tok' });
      }
      return jsonResponse({ id: 'evt_123' });
    }) as unknown as typeof fetch;

    const result = await createCalendarEvent(
      {
        summary: 'Lectura — Ana',
        startIso: '2026-09-20T14:00:00.000Z',
        endIso: '2026-09-20T15:00:00.000Z',
      },
      { fetchImpl }
    );
    expect(result).toEqual({ id: 'evt_123' });
    expect(calls.some((c) => c.url.includes('/calendar/v3/') && c.method === 'POST')).toBe(true);
  });
});

describe('updateCalendarEvent', () => {
  it('PUTs to the event url', async () => {
    const calls: string[] = [];
    const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push(`${init?.method ?? 'GET'} ${String(url)}`);
      if (String(url).includes('oauth2.googleapis.com')) {
        return jsonResponse({ access_token: 'tok' });
      }
      return jsonResponse({ id: 'evt_123' });
    }) as unknown as typeof fetch;

    const result = await updateCalendarEvent(
      'evt_123',
      {
        summary: 'Lectura — Ana (reprogramado)',
        startIso: '2026-09-21T14:00:00.000Z',
        endIso: '2026-09-21T15:00:00.000Z',
      },
      { fetchImpl }
    );
    expect(result).toEqual({ id: 'evt_123' });
    expect(calls.some((c) => c.startsWith('PUT') && c.includes('evt_123'))).toBe(true);
  });
});

describe('deleteCalendarEvent', () => {
  it('sends DELETE and treats 404 as success', async () => {
    const fetchImpl = (async (url: string | URL | Request) => {
      if (String(url).includes('oauth2.googleapis.com')) {
        return jsonResponse({ access_token: 'tok' });
      }
      return { ok: false, status: 404, text: () => Promise.resolve('not found') } as Response;
    }) as unknown as typeof fetch;

    await expect(deleteCalendarEvent('evt_gone', { fetchImpl })).resolves.toBeUndefined();
  });

  it('throws on server errors', async () => {
    const fetchImpl = (async (url: string | URL | Request) => {
      if (String(url).includes('oauth2.googleapis.com')) {
        return jsonResponse({ access_token: 'tok' });
      }
      return { ok: false, status: 500, text: () => Promise.resolve('boom') } as Response;
    }) as unknown as typeof fetch;

    await expect(deleteCalendarEvent('evt_123', { fetchImpl })).rejects.toThrow(
      /delete failed/
    );
  });
});

describe('upsertAppointmentEvent', () => {
  it('creates when there is no existing event id', async () => {
    const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url).includes('oauth2.googleapis.com')) {
        return jsonResponse({ access_token: 'tok' });
      }
      expect(init?.method).toBe('POST');
      return jsonResponse({ id: 'evt_new' });
    }) as unknown as typeof fetch;

    const result = await upsertAppointmentEvent(
      {
        clientName: 'Ana',
        clientEmail: 'ana@example.com',
        serviceName: 'Tarot',
        appointmentDateIso: '2026-09-20T14:00:00.000Z',
      },
      null,
      { fetchImpl }
    );
    expect(result).toEqual({ id: 'evt_new' });
  });

  it('updates when an existing event id is passed', async () => {
    const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url).includes('oauth2.googleapis.com')) {
        return jsonResponse({ access_token: 'tok' });
      }
      expect(init?.method).toBe('PUT');
      expect(String(url)).toContain('evt_old');
      return jsonResponse({ id: 'evt_old' });
    }) as unknown as typeof fetch;

    const result = await upsertAppointmentEvent(
      {
        clientName: 'Ana',
        clientEmail: 'ana@example.com',
        serviceName: 'Tarot',
        appointmentDateIso: '2026-09-20T14:00:00.000Z',
      },
      'evt_old',
      { fetchImpl }
    );
    expect(result).toEqual({ id: 'evt_old' });
  });
});
