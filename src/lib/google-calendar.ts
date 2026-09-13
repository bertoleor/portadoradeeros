/**
 * Google Calendar sync (server-only).
 *
 * OAuth2 offline flow: the admin grants access once, Google returns a
 * long-lived refresh token stored in `GOOGLE_REFRESH_TOKEN`. At runtime we
 * exchange it for a short-lived access token (no user interaction, no browser
 * redirect needed in production).
 *
 * Uses plain `fetch` against the Google REST endpoints — no extra dependency.
 * All network calls accept an injectable `fetchImpl` so tests can run with
 * mocks and no real credentials.
 *
 * IMPORTANT: never import this module from client components ('use client').
 * It reads `GOOGLE_CLIENT_SECRET` / `GOOGLE_REFRESH_TOKEN`.
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

export const DEFAULT_CALENDAR_TIMEZONE = 'America/Argentina/Buenos_Aires';
export const DEFAULT_APPOINTMENT_DURATION_MIN = 60;

export type FetchImpl = typeof fetch;

interface FetchOpts {
  fetchImpl?: FetchImpl;
}

export interface CalendarAttendee {
  email: string;
}

export interface CalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  /** ISO-8601 start, e.g. `new Date().toISOString()` */
  startIso: string;
  /** ISO-8601 end */
  endIso: string;
  timeZone?: string;
  attendees?: CalendarAttendee[];
}

/** Minimal appointment data needed to build a calendar event. */
export interface AppointmentCalendarData {
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  serviceName: string;
  appointmentDateIso: string;
  durationMinutes?: number;
  notes?: string | null;
  status?: string | null;
}

interface GoogleEventBody {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: { email: string }[];
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface EventResponse {
  id?: string;
  error?: { message?: string };
}

function calendarId(): string {
  const raw = process.env.GOOGLE_CALENDAR_ID;
  return raw !== undefined && raw.trim().length > 0 ? raw.trim() : 'primary';
}

function calendarTimeZone(): string {
  const raw = process.env.GOOGLE_CALENDAR_TIMEZONE;
  return raw !== undefined && raw.trim().length > 0 ? raw.trim() : DEFAULT_CALENDAR_TIMEZONE;
}

/** True when all server env vars needed for sync are present. */
export function isGoogleCalendarConfigured(): boolean {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  const refresh = process.env.GOOGLE_REFRESH_TOKEN;
  return (
    id !== undefined &&
    id.trim().length > 0 &&
    secret !== undefined &&
    secret.trim().length > 0 &&
    refresh !== undefined &&
    refresh.trim().length > 0
  );
}

/** Only confirmed/completed appointments belong on the admin's calendar. */
export function shouldSyncStatus(status: string | null | undefined): boolean {
  return status === 'confirmed' || status === 'completed';
}

/** End time for an appointment given its start ISO string and duration. */
export function getAppointmentEndIso(startIso: string, durationMinutes: number): string {
  const duration =
    Number.isFinite(durationMinutes) && durationMinutes > 0
      ? durationMinutes
      : DEFAULT_APPOINTMENT_DURATION_MIN;
  const end = new Date(new Date(startIso).getTime() + duration * 60_000);
  return end.toISOString();
}

/** Build the Google Calendar API request body for an appointment. */
export function buildCalendarEventBody(data: AppointmentCalendarData): GoogleEventBody {
  const duration =
    data.durationMinutes !== undefined && data.durationMinutes > 0
      ? data.durationMinutes
      : DEFAULT_APPOINTMENT_DURATION_MIN;
  const timeZone = calendarTimeZone();
  const lines = [
    `Cliente: ${data.clientName}`,
    `Email: ${data.clientEmail}`,
    data.clientPhone !== undefined && data.clientPhone !== null && data.clientPhone.length > 0
      ? `Teléfono: ${data.clientPhone}`
      : null,
    `Servicio: ${data.serviceName}`,
    data.status !== undefined && data.status !== null && data.status.length > 0
      ? `Estado: ${data.status}`
      : null,
    data.notes !== undefined && data.notes !== null && data.notes.length > 0
      ? `Notas: ${data.notes}`
      : null,
  ].filter((line): line is string => line !== null);

  const body: GoogleEventBody = {
    summary: `${data.serviceName} — ${data.clientName}`,
    description: lines.join('\n'),
    start: { dateTime: data.appointmentDateIso, timeZone },
    end: { dateTime: getAppointmentEndIso(data.appointmentDateIso, duration), timeZone },
    attendees: [{ email: data.clientEmail }],
  };
  return body;
}

/** Build a generic event body from an explicit input (create/update). */
export function buildEventBody(input: CalendarEventInput): GoogleEventBody {
  const body: GoogleEventBody = {
    summary: input.summary,
    start: {
      dateTime: input.startIso,
      timeZone: input.timeZone ?? calendarTimeZone(),
    },
    end: {
      dateTime: input.endIso,
      timeZone: input.timeZone ?? calendarTimeZone(),
    },
  };
  if (input.description !== undefined) body.description = input.description;
  if (input.location !== undefined) body.location = input.location;
  if (input.attendees !== undefined) {
    body.attendees = input.attendees.map((a) => ({ email: a.email }));
  }
  return body;
}

function readErrorBody(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return 'unknown error';
  }
}

/** Exchange the stored refresh token for a short-lived access token. */
export async function getGoogleAccessToken(opts: FetchOpts = {}): Promise<string> {
  const fetchImpl: FetchImpl = opts.fetchImpl ?? fetch;
  const clientId = process.env.GOOGLE_CLIENT_ID ?? '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN ?? '';

  if (clientId.length === 0 || clientSecret.length === 0 || refreshToken.length === 0) {
    throw new Error(
      'Google Calendar is not configured (missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN).'
    );
  }

  const response = await fetchImpl(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Google token refresh failed (${response.status}): ${text}`);
  }

  const payload = (await response.json()) as TokenResponse;
  if (payload.access_token === undefined || payload.access_token.length === 0) {
    throw new Error(`Google token refresh failed: ${readErrorBody(payload)}`);
  }
  return payload.access_token;
}

/** Create an event on the admin's calendar. Returns the Google event id. */
export async function createCalendarEvent(
  input: CalendarEventInput,
  opts: FetchOpts = {}
): Promise<{ id: string }> {
  const fetchImpl: FetchImpl = opts.fetchImpl ?? fetch;
  const accessToken = await getGoogleAccessToken(opts);
  const response = await fetchImpl(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId())}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildEventBody(input)),
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Google Calendar create failed (${response.status}): ${text}`);
  }
  const payload = (await response.json()) as EventResponse;
  if (payload.id === undefined || payload.id.length === 0) {
    throw new Error(`Google Calendar create failed: ${readErrorBody(payload)}`);
  }
  return { id: payload.id };
}

/** Replace an existing event (PUT). Returns the Google event id. */
export async function updateCalendarEvent(
  eventId: string,
  input: CalendarEventInput,
  opts: FetchOpts = {}
): Promise<{ id: string }> {
  const fetchImpl: FetchImpl = opts.fetchImpl ?? fetch;
  const accessToken = await getGoogleAccessToken(opts);
  const response = await fetchImpl(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId())}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildEventBody(input)),
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Google Calendar update failed (${response.status}): ${text}`);
  }
  const payload = (await response.json()) as EventResponse;
  if (payload.id === undefined || payload.id.length === 0) {
    throw new Error(`Google Calendar update failed: ${readErrorBody(payload)}`);
  }
  return { id: payload.id };
}

/** Delete an event. A 404/410 (already gone) is treated as success. */
export async function deleteCalendarEvent(eventId: string, opts: FetchOpts = {}): Promise<void> {
  const fetchImpl: FetchImpl = opts.fetchImpl ?? fetch;
  const accessToken = await getGoogleAccessToken(opts);
  const response = await fetchImpl(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId())}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (response.ok || response.status === 404 || response.status === 410) {
    return;
  }
  const text = await response.text().catch(() => '');
  throw new Error(`Google Calendar delete failed (${response.status}): ${text}`);
}

/**
 * Convenience wrapper: build the event input from appointment data and
 * create-or-update it. Pass the stored `google_event_id` (if any) to update
 * instead of duplicating the event.
 */
export async function upsertAppointmentEvent(
  data: AppointmentCalendarData,
  existingEventId: string | null | undefined,
  opts: FetchOpts = {}
): Promise<{ id: string }> {
  const duration =
    data.durationMinutes !== undefined && data.durationMinutes > 0
      ? data.durationMinutes
      : DEFAULT_APPOINTMENT_DURATION_MIN;
  const timeZone = calendarTimeZone();
  const input: CalendarEventInput = {
    summary: `${data.serviceName} — ${data.clientName}`,
    description: buildCalendarEventBody(data).description ?? '',
    startIso: data.appointmentDateIso,
    endIso: getAppointmentEndIso(data.appointmentDateIso, duration),
    timeZone,
    attendees: [{ email: data.clientEmail }],
  };
  if (existingEventId !== undefined && existingEventId !== null && existingEventId.length > 0) {
    return updateCalendarEvent(existingEventId, input, opts);
  }
  return createCalendarEvent(input, opts);
}
