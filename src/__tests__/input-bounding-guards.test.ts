import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/* eslint-disable security/detect-non-literal-fs-filename -- test reads a
   fixed allow-list of repo files; the path is never attacker-controlled. */

/**
 * EROS input-bounding regression guards (ODD eros-email-input-hardening, T2).
 *
 * Server-side zod caps stay the authority: `contactSchema`
 * (src/app/api/contact/route.ts) and `appointmentSchema`
 * (src/lib/api/appointments-schemas.ts). These guards lock the client-side
 * maxLength bounds on the two public forms so oversized free text is stopped
 * at the input and the email subjects built from those values remain bounded:
 *
 *   - Contact form mirrors contactSchema exactly:
 *     name 200, email 320, phone 50, message 5000.
 *   - Booking form mirrors appointmentSchema per-field maximums:
 *     name/surname 300 each (server bounds the `${name} ${surname}`
 *     concatenation at 300), email 320, phone 50, notes 5000.
 */

const read = (rel: string) =>
  readFileSync(fileURLToPath(new URL(`../../${rel}`, import.meta.url)), 'utf8');

/** True when `cap` appears as a maxLength within 400 chars after `anchor`. */
const hasCap = (src: string, anchor: string, cap: number) =>
  new RegExp(
    `${anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]{0,400}?maxLength[=:}]\\s*\\{?${cap}\\}?`
  ).test(src);

describe('Contact form inputs are maxLength-bounded (contactSchema mirror)', () => {
  const src = read('src/app/contacto/page.tsx');

  it('name input is capped at 200 (contactSchema name.max)', () => {
    expect(hasCap(src, 'id="name"', 200)).toBe(true);
  });

  it('email input is capped at 320 (contactSchema email.max)', () => {
    expect(hasCap(src, 'id="email"', 320)).toBe(true);
  });

  it('phone input is capped at 50 (contactSchema phone.max)', () => {
    expect(hasCap(src, 'id="phone"', 50)).toBe(true);
  });

  it('message textarea is capped at 5000 (contactSchema message.max)', () => {
    expect(hasCap(src, 'id="message"', 5000)).toBe(true);
  });
});

describe('Booking form inputs are maxLength-bounded (appointmentSchema mirror)', () => {
  const src = read('src/components/client/ServiceContactForm.tsx');

  it.each([
    ['name', 300],
    ['surname', 300],
    ['email', 320],
    ['phone', 50],
  ])('%s field entry declares maxLength %i', (id, cap) => {
    expect(hasCap(src, `id: '${id}'`, cap)).toBe(true);
  });

  it('the mapped <Input> actually renders maxLength from the field entry', () => {
    expect(src).toContain('maxLength={f.maxLength}');
  });

  it('notes textarea is capped at 5000 (appointmentSchema notes.max)', () => {
    expect(hasCap(src, 'id="message"', 5000)).toBe(true);
  });
});
