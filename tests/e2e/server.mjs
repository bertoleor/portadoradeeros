/**
 * Standalone Supabase REST stub server for E2E (EROS).
 *
 * Runs as a real HTTP server on 127.0.0.1:54321 so the Next.js SERVER-side
 * fetches (server components, server actions, service-role client — traffic
 * that a browser-level `page.route()` can never intercept) hit deterministic
 * fixtures instead of the live Supabase project.
 *
 * Playwright's `webServer.command` starts this file, which spawns `next dev`
 * as a child with Supabase env vars pointing back at itself.
 *
 * Implemented with zero dependencies: node:http + manual JSON responses.
 */

import { spawn } from 'node:child_process';
import http from 'node:http';

const STUB_PORT = 54321;

/** Services mirroring supabase_seed.sql (tarot 60', buzios 90'). */
const services = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    slug: 'tarot',
    title: 'Sesión de Tarot',
    short_description: 'Explorá tu pasado, presente y futuro a través de las cartas',
    description:
      'Las cartas del tarot son una herramienta ancestral que permite explorar el pasado, presente y futuro.',
    price: 5000,
    duration: 60,
    is_visible: true,
    icon: 'tarot',
    images: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    slug: 'buzios',
    title: 'Sesión de Buzios',
    short_description: 'Conexión con los orishas para recibir mensajes divinos',
    description: 'Los buzios son conchas sagradas utilizadas para comunicarse con los orishas.',
    price: 6000,
    duration: 90,
    is_visible: true,
    icon: 'buzios',
    images: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const openEveryDay = Object.fromEntries(
  ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day) => [
    day,
    { closed: false, start: '09:00', end: '18:00' },
  ])
);

const settingsRow = {
  id: 1,
  contact_email: 'portadoradeeros@gmail.com',
  site_url: null,
  instagram_url: null,
  whatsapp_url: null,
  tiktok_url: null,
  bank_owner: 'Jacqueline Test',
  bank_name: 'Mercado Pago',
  bank_cbu: '0000003100000000000001',
  bank_alias: 'portadora.eros.test',
  bio_content: '',
  profile_image_url: null,
  business_hours: openEveryDay,
  admin_name: 'Jacque',
  admin_avatar_url: null,
};

/** In-memory appointments; the spec asserts via the console log below. */
const createdAppointments = [];

function rowsFor(table) {
  switch (table) {
    case 'services':
      return services;
    case 'admin_settings':
      return [settingsRow];
    case 'appointments':
      return createdAppointments;
    default:
      return [];
  }
}

/**
 * PostgREST subset actually used by supabase-js:
 * `?slug=eq.tarot`, `?id=eq.1`, `?is_visible=eq.true`, ranges via
 * `appointment_date=gte...&lte...`, `status=neq.cancelled`.
 */
function matches(row, searchParams) {
  for (const [key, raw] of searchParams.entries()) {
    const [op, ...rest] = raw.split('.');
    const expected = rest.join('.');
    const actual = row[key];
    // The fixture rows are our own static data; keys come from supabase-js
    // query params — never attacker-controlled. (object-injection FP)
    if (op === 'eq') {
      if (String(actual) !== expected) {
        return false;
      }
    }
    if (op === 'neq') {
      if (String(actual) === expected) {
        return false;
      }
    }
    if (op === 'gte' || op === 'lte') {
      const a = Date.parse(String(actual));
      const e = Date.parse(expected);
      if (Number.isNaN(a) || Number.isNaN(e)) {
        if (op === 'gte' && !(String(actual) >= expected)) {
          return false;
        }
        if (op === 'lte' && !(String(actual) <= expected)) {
          return false;
        }
        continue;
      }
      if (op === 'gte' && !(a >= e)) {
        return false;
      }
      if (op === 'lte' && !(a <= e)) {
        return false;
      }
    }
  }
  return true;
}

function send(res, status, body, extraHeaders = {}) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json',
    ...extraHeaders,
  });
  res.end(json);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${STUB_PORT}`);
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf8');

    // Auth (middleware calls supabase.auth.getUser on every request)
    if (url.pathname.startsWith('/auth/')) {
      return send(res, 200, { data: { user: null }, error: null });
    }

    const restMatch = url.pathname.match(/^\/rest\/v1\/([a-z_]+)$/);
    if (!restMatch) {
      return send(res, 404, { message: 'not found' });
    }

    const table = restMatch[1];
    const accept = req.headers['accept'] ?? '';
    const isObject = accept.includes('vnd.pgrst.object');

    if (req.method === 'POST') {
      let inserted;
      try {
        inserted = JSON.parse(body || '[]');
      } catch {
        inserted = [];
      }
      const rows = rowsFor(table);
      for (const row of inserted) {
        rows.push({ ...row, id: row.id ?? `stub-${rows.length + 1}` });
      }
      const last = rows[rows.length - 1] ?? {};
      // eslint-disable-next-line no-console -- stub server diagnostics
      console.log(`[supabase-stub] POST ${table} → created`, JSON.stringify(last));
      return send(res, 201, last, { 'content-profile': 'public' });
    }

    const filtered = rowsFor(table).filter((row) => matches(row, url.searchParams));
    return send(res, 200, isObject ? (filtered[0] ?? null) : filtered);
  });
});

server.listen(STUB_PORT, '127.0.0.1', () => {
  // eslint-disable-next-line no-console -- stub server diagnostics
  console.log(`[supabase-stub] listening on http://127.0.0.1:${STUB_PORT}`);

  // Optional standalone mode: when E2E_STUB_ONLY is set the stub does NOT
  // spawn `next dev` — used by tests/e2e/a11y-scan.mjs, which boots its own
  // `next start` (production build) against this stub instead.
  if (process.env.E2E_STUB_ONLY) {
    return;
  }

  // Start Next dev as a child so both servers share the webServer lifecycle.
  const next = spawn('npx', ['next', 'dev'], {
    cwd: process.cwd(),
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${STUB_PORT}`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'e2e-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'e2e-service-role-key',
      // NEUTRALIZE real email: without a RESEND_API_KEY the Resend client
      // fails fast inside the flow's try/catch; smtp is picked as provider
      // but has no host. `.env.local` values DO leak through Next's env
      // loading (merged with process.env), so every real credential must be
      // explicitly overridden here — the first green run accidentally hit
      // api.resend.com with the production key.
      EMAIL_PROVIDER: 'smtp',
      RESEND_API_KEY: '',
      SMTP_HOST: '',
      SMTP_USER: '',
      SMTP_PASS: '',
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: '',
      VAPID_PRIVATE_KEY: '',
    },
  });
  next.on('exit', (code) => {
    server.close();
    process.exit(code ?? 0);
  });
});
