import { describe, expect, it } from 'vitest';

import { contactSchema } from './route';

describe('contactSchema', () => {
  it('accepts a minimal valid contact payload', () => {
    const r = contactSchema.safeParse({
      name: 'Ana',
      email: 'ana@example.com',
      message: 'Hola, quiero un turno.',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.phone).toBeUndefined();
    }
  });

  it('accepts optional phone and honeypot fields', () => {
    const r = contactSchema.safeParse({
      name: 'Ana',
      email: 'ana@example.com',
      message: 'Hola',
      phone: '+54 11 5555 5555',
      company_website: '',
    });
    expect(r.success).toBe(true);
  });

  it('rejects a missing name', () => {
    const r = contactSchema.safeParse({ email: 'a@b.com', message: 'Hola' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === 'name')).toBe(true);
    }
  });

  it('rejects a missing message', () => {
    const r = contactSchema.safeParse({ name: 'Ana', email: 'a@b.com' });
    expect(r.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const bad = ['nope', 'a b@c.com', '@sinlocal.com'];
    for (const email of bad) {
      const r = contactSchema.safeParse({ name: 'Ana', email, message: 'Hola' });
      expect(r.success, `should reject email "${email}"`).toBe(false);
    }
  });

  it('rejects a fully empty payload', () => {
    expect(contactSchema.safeParse({}).success).toBe(false);
  });
});
