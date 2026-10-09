/**
 * Anti-overbooking tests for the PUBLIC booking path (ORN-173).
 *
 * Contract: `createAppointment` must reject a proposed appointment that
 * overlaps any existing non-cancelled appointment, exactly like the admin
 * path (`createAppointmentAdmin`) already does via `checkSlotAvailability`.
 * The check happens BEFORE the insert: no DB write, no emails, no push.
 *
 * Mock wiring notes (they encode real call-shape facts of the codebase):
 * - `createServiceClient()` and `createAdminClient()` are SYNCHRONOUS
 *   factories (call sites do not await them); `createClient()` is awaited.
 * - The PostgREST query builder is thenable: `await query` resolves to
 *   `{ data, error }`. The mock chain implements `then` accordingly.
 * - `checkRateLimit` uses a module-level in-process store shared across
 *   tests in this file, so each test books from a DIFFERENT client IP to
 *   stay under the 5 req/min public limit.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

/* ------------------------------------------------------------------ */
/* Mocks — wired before importing the module under test                */
/* ------------------------------------------------------------------ */

// web-push: setVapidDetails is called at module load when env keys exist.
vi.mock('web-push', () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: vi.fn() },
}));

// Per-test client IP, consumed by the next/headers mock below.
let testClientIp = '10.0.0.1';

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers({ 'x-forwarded-for': testClientIp })),
}));

// Email sender: must never run for a rejected booking. The route to the
// provider goes through the real dispatcher (@/lib/email), so this mock
// only pins the concrete Resend module the dispatcher delegates to.
vi.mock('@/lib/email/resend', () => ({
  sendAppointmentCancellation: vi.fn(),
  sendAppointmentConfirmation: vi.fn(),
  sendAppointmentConfirmed: vi.fn(),
  sendNewAppointmentNotification: vi.fn(),
}));

// SMTP provider (EROS-D2): mocked so dispatch tests can assert that
// EMAIL_PROVIDER=smtp actually reroutes the booking emails.
vi.mock('@/lib/email/smtp', () => ({
  sendAppointmentCancellation: vi.fn(),
  sendAppointmentConfirmation: vi.fn(async () => ({ success: true, id: 'smtp-mock' })),
  sendAppointmentConfirmed: vi.fn(),
  sendNewAppointmentNotification: vi.fn(async () => ({ success: true, id: 'smtp-mock' })),
}));

// requireAdmin: not used by the public path, mocked for safety.
vi.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: vi.fn(async () => true) }));

// Admin settings: provides bank details for the confirmation email.
vi.mock('@/lib/api/settings', () => ({
  getAdminSettings: vi.fn(async () => ({
    bankDetails: { bankOwner: 'x', bankName: 'y', cbu: 'z', alias: 'w' },
  })),
}));

/* ------------------------------------------------------------------ */
/* Supabase client factory mocks                                       */
/* ------------------------------------------------------------------ */

interface ServiceRow {
  appointment_date: string;
  service_id: string | null;
  services: { duration: number } | null;
}

/**
 * Builds a chainable supabase-query mock. `await chain` resolves to
 * `{ data: rows, error: queryError }`, mirroring the real PostgREST builder
 * (which is thenable). Implemented via Promise subclassing so the chain is
 * BOTH a thenable (awaitable) and an object with builder methods.
 */
function makeQuery(rows: ServiceRow[], queryError: { message: string } | null = null) {
  class Chain extends Promise<unknown> {
    select = vi.fn(() => chain);
    filter = vi.fn(() => chain);
    gte = vi.fn(() => chain);
    lte = vi.fn(() => chain);
    neq = vi.fn(() => chain);
    eq = vi.fn(() => chain);
    order = vi.fn(() => chain);
    maybeSingle = vi.fn(async () => ({ data: null, error: null }));
    single = vi.fn(async () => ({ data: rows[0], error: null }));
  }
  const chain = Chain.resolve({ data: rows, error: queryError }) as Chain & Record<string, unknown>;
  return chain;
}

let availabilityRows: ServiceRow[] = [];
let insertAttempts: { table: string }[] = [];

/** Chain answering the service-role availability query. */
let availabilityChain: Record<string, unknown> = makeQuery([]);

function setAvailability(rows: ServiceRow[], queryError: { message: string } | null = null) {
  availabilityRows = rows;
  availabilityChain = makeQuery(rows, queryError);
}

/**
 * Anon/server client wrapper. Records INSERT attempts on any table so tests
 * can assert "the booking was never written".
 */
function anonWrapper() {
  const chain = makeQuery(availabilityRows);
  return {
    from: (table: string) =>
      new Proxy(chain, {
        get(target, prop, receiver) {
          if (prop === 'insert') {
            return () => {
              insertAttempts.push({ table });
              return { select: () => ({ single: async () => ({ data: {}, error: null }) }) };
            };
          }
          return Reflect.get(target, prop, receiver);
        },
      }),
  };
}

// `createClient()` is awaited at every call site → async factory is fine.
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn(async () => anonWrapper()) }));

// `createAdminClient()` is called WITHOUT await (push subscriptions) → sync.
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => anonWrapper()),
}));

// `createServiceClient()` is called WITHOUT await (availability) → sync.
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({
    from: (table: string) => {
      if (table === 'appointments') {
        return availabilityChain;
      }
      throw new Error(`unexpected service table: ${table}`);
    },
  })),
}));

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Import AFTER all vi.mock calls take effect.
import { createAppointment } from './appointments';
import { appointmentSchema } from './appointments-schemas';

const basePayload = {
  serviceId: 'svc-1',
  serviceName: 'Lectura', // email-only field
  clientName: 'Ana',
  clientEmail: 'ana@example.com',
  clientPhone: '+5491100000000',
  appointmentDate: new Date('2026-10-01T14:00:00'), // local 14:00
  notes: '',
};

/** An existing appointment starting at `hour`:00 with the given duration. */
function existingAt(hour: number, duration = 60): ServiceRow {
  const start = new Date('2026-10-01T00:00:00');
  start.setHours(hour, 0, 0, 0);
  return {
    appointment_date: start.toISOString(),
    service_id: 'svc-existing',
    services: { duration },
  };
}

let ipCounter = 1;

beforeEach(() => {
  vi.clearAllMocks();
  testClientIp = `10.1.0.${ipCounter++}`; // fresh rate-limit bucket per test
  insertAttempts = [];
  setAvailability([]);
});

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

describe('createAppointment — anti-overbooking (ORN-173)', () => {
  it('REJECTS an overlapping slot (same start time as an existing appointment)', async () => {
    setAvailability([existingAt(14)]);
    const result = await createAppointment(basePayload);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toMatch(/otro horario/i);
    }
    expect(insertAttempts).toHaveLength(0);
  });

  it('REJECTS a slot contained inside an existing appointment (starts mid-service)', async () => {
    // Existing 14:00–15:00; propose 14:30 (60 min) → 14:30–15:30 overlaps.
    setAvailability([existingAt(14)]);
    const result = await createAppointment({
      ...basePayload,
      appointmentDate: new Date('2026-10-01T14:30:00'),
    });
    expect(result.ok).toBe(false);
    expect(insertAttempts).toHaveLength(0);
  });

  it('REJECTS a slot that swallows an existing appointment (spans over it)', async () => {
    // Existing 15:00–16:00; propose 14:30–15:30 → overlap.
    setAvailability([existingAt(15)]);
    const result = await createAppointment({
      ...basePayload,
      appointmentDate: new Date('2026-10-01T14:30:00'),
    });
    expect(result.ok).toBe(false);
    expect(insertAttempts).toHaveLength(0);
  });

  it('REJECTS using the service duration when the payload carries one', async () => {
    // Existing 14:00–15:00. Proposed 15:00 with a 90-minute service would
    // occupy 15:00–16:30; an existing 16:00 appointment must collide.
    setAvailability([existingAt(14), existingAt(16)]);
    const result = await createAppointment({
      ...basePayload,
      appointmentDate: new Date('2026-10-01T15:00:00'),
      serviceDurationMinutes: 90,
    });
    expect(result.ok).toBe(false);
    expect(insertAttempts).toHaveLength(0);
  });

  it('ALLOWS back-to-back slot touching existing end (no gap, no overlap)', async () => {
    // Existing 14:00–15:00; propose 15:00 → free.
    setAvailability([existingAt(14)]);
    const result = await createAppointment({
      ...basePayload,
      appointmentDate: new Date('2026-10-01T15:00:00'),
    });
    expect(result.ok).toBe(true);
    expect(insertAttempts.length).toBeGreaterThanOrEqual(1);
  });

  it('ALLOWS a free slot far from any existing appointment', async () => {
    setAvailability([existingAt(9)]);
    const result = await createAppointment(basePayload); // 14:00 far from 09:00
    expect(result.ok).toBe(true);
  });

  it('IGNORES cancelled appointments when checking overlap', async () => {
    // The service-role query filters `.neq('status','cancelled')` server-side;
    // the mock returns the post-filter row set, so an empty set means every
    // conflicting appointment was cancelled → the slot must be admitted.
    setAvailability([]);
    const result = await createAppointment(basePayload);
    expect(result.ok).toBe(true);
    expect(insertAttempts.length).toBeGreaterThanOrEqual(1);
  });

  it('FAILS CLOSED: availability query error → slot unavailable, no insert', async () => {
    setAvailability([], { message: 'boom' });
    const result = await createAppointment(basePayload);
    expect(result.ok).toBe(false);
    expect(insertAttempts).toHaveLength(0);
  });

  it('keeps honeypot behavior intact (no regression, no insert, fake success)', async () => {
    setAvailability([existingAt(14)]); // would collide, but honeypot short-circuits first
    const bot = await createAppointment({
      ...basePayload,
      company_website: 'http://spam.example',
    });
    expect(bot.ok).toBe(true);
    expect(insertAttempts).toHaveLength(0);
  });
});

describe('createAppointment — email provider dispatch (EROS-D2)', () => {
  it('reroutes booking emails to SMTP when EMAIL_PROVIDER=smtp', async () => {
    process.env.EMAIL_PROVIDER = 'smtp';
    try {
      const result = await createAppointment(basePayload); // free slot → allowed
      expect(result.ok).toBe(true);

      const smtp = await import('@/lib/email/smtp');
      expect(vi.mocked(smtp.sendNewAppointmentNotification)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(smtp.sendAppointmentConfirmation)).toHaveBeenCalledTimes(1);

      // Resend must NOT be touched when the SMTP provider is selected.
      const resend = await import('@/lib/email/resend');
      expect(vi.mocked(resend.sendNewAppointmentNotification)).not.toHaveBeenCalled();
      expect(vi.mocked(resend.sendAppointmentConfirmation)).not.toHaveBeenCalled();
    } finally {
      delete process.env.EMAIL_PROVIDER;
    }
  });
});

describe('createAppointment — server-side payload validation (H3)', () => {
  it('exports an appointmentSchema that accepts the canonical booking payload', async () => {
    const r = appointmentSchema.safeParse(basePayload);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.clientName).toBe('Ana');
      expect(r.data.serviceName).toBe('Lectura');
    }
  });

  it('trims and bounds free-text fields (name/service/notes/phone)', async () => {
    const r = appointmentSchema.safeParse({
      serviceId: 'svc-1',
      serviceName: '  Lectura de tarot  ',
      clientName: '  Ana Pérez  ',
      clientEmail: 'ana@example.com',
      clientPhone: '  +54 11 5555 5555  ',
      appointmentDate: new Date('2026-10-01T14:00:00'),
      notes: '  Voy con mi mamá  ',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.clientName).toBe('Ana Pérez');
      expect(r.data.serviceName).toBe('Lectura de tarot');
      expect(r.data.notes).toBe('Voy con mi mamá');
      expect(r.data.clientPhone).toBe('+54 11 5555 5555');
    }
  });

  it('rejects over-long fields (public-form payload cap)', async () => {
    const base = {
      serviceId: 'svc-1',
      serviceName: 'Lectura',
      clientEmail: 'ana@example.com',
      appointmentDate: new Date('2026-10-01T14:00:00'),
    };
    expect(appointmentSchema.safeParse({ ...base, clientName: 'x'.repeat(301) }).success).toBe(
      false
    );
    expect(appointmentSchema.safeParse({ ...base, serviceName: 'x'.repeat(201) }).success).toBe(
      false
    );
    expect(appointmentSchema.safeParse({ ...base, notes: 'x'.repeat(5001) }).success).toBe(false);
    expect(appointmentSchema.safeParse({ ...base, clientPhone: '5'.repeat(51) }).success).toBe(
      false
    );
  });

  it('rejects a whitespace-only clientName (would land in the email subject)', async () => {
    const r = appointmentSchema.safeParse({
      serviceId: 'svc-1',
      serviceName: 'Lectura',
      clientName: '   ',
      clientEmail: 'ana@example.com',
      appointmentDate: new Date('2026-10-01T14:00:00'),
    });
    expect(r.success).toBe(false);
  });

  it('rejects an invalid/missing appointmentDate (Date instance only, no ISO strings)', async () => {
    const base = {
      serviceId: 'svc-1',
      serviceName: 'Lectura',
      clientName: 'Ana',
      clientEmail: 'ana@example.com',
    };
    // missing
    expect(appointmentSchema.safeParse(base).success).toBe(false);
    // ISO string is NOT a Date instance — the schema demands a real Date
    expect(
      appointmentSchema.safeParse({ ...base, appointmentDate: '2026-10-01T14:00:00.000Z' }).success
    ).toBe(false);
    // invalid Date instance
    expect(
      appointmentSchema.safeParse({ ...base, appointmentDate: new Date('garbage') }).success
    ).toBe(false);
  });

  it('rejects non-finite/absurd serviceDurationMinutes', async () => {
    const base = {
      serviceId: 'svc-1',
      serviceName: 'Lectura',
      clientName: 'Ana',
      clientEmail: 'ana@example.com',
      appointmentDate: new Date('2026-10-01T14:00:00'),
    };
    expect(appointmentSchema.safeParse({ ...base, serviceDurationMinutes: 0 }).success).toBe(false);
    expect(appointmentSchema.safeParse({ ...base, serviceDurationMinutes: -5 }).success).toBe(
      false
    );
    expect(appointmentSchema.safeParse({ ...base, serviceDurationMinutes: 1e9 }).success).toBe(
      false
    );
    expect(appointmentSchema.safeParse({ ...base, serviceDurationMinutes: 60 }).success).toBe(true);
  });

  it('createAppointment rejects a schema-invalid payload BEFORE any side effect', async () => {
    setAvailability([]); // FREE slot — only the schema can reject this payload
    const result = await createAppointment({
      ...basePayload,
      clientName: 'x'.repeat(301), // over the cap
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION');
    }
    expect(insertAttempts).toHaveLength(0);
  });

  it('createAppointment still allows a valid payload end-to-end (trim applied)', async () => {
    setAvailability([]);
    const result = await createAppointment({
      ...basePayload,
      clientName: '  Ana  ',
      notes: '  nota  ',
    });
    expect(result.ok).toBe(true);
    // The honeypot short-circuit returns ok — need the real path; verify insert happened
    expect(insertAttempts.length).toBeGreaterThanOrEqual(1);
  });
});
