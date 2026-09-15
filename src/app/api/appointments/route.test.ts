import { describe, expect, it } from 'vitest';

import { appointmentSchema } from './route';

const validAppointment = {
  name: 'Ana',
  surname: 'García',
  email: 'ana@example.com',
  phone: '+54 11 5555 5555',
  service: 'Masaje descontracturante',
  date: '2026-09-20',
  time: '10:00',
  price: 15000,
};

describe('appointmentSchema', () => {
  it('accepts a minimal valid appointment payload', () => {
    const r = appointmentSchema.safeParse(validAppointment);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.price).toBe(15000);
      expect(r.data.bankDetails).toBeUndefined();
    }
  });

  it('coerces a numeric string price (z.coerce.number)', () => {
    const r = appointmentSchema.safeParse({ ...validAppointment, price: '15000' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.price).toBe(15000);
    }
  });

  it('rejects a non-coercible price', () => {
    const r = appointmentSchema.safeParse({ ...validAppointment, price: 'abc' });
    expect(r.success).toBe(false);
  });

  it('accepts bankDetails and fills its defaults when partially provided', () => {
    const r = appointmentSchema.safeParse({
      ...validAppointment,
      bankDetails: { bankName: 'Banco Nación' },
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.bankDetails?.bankName).toBe('Banco Nación');
      expect(r.data.bankDetails?.accountType).toBe('');
      expect(r.data.bankDetails?.cbu).toBe('');
    }
  });

  it('rejects missing required fields (surname, service, time)', () => {
    for (const key of ['name', 'surname', 'email', 'phone', 'service', 'date', 'time']) {
      const rest = Object.fromEntries(Object.entries(validAppointment).filter(([k]) => k !== key));
      const r = appointmentSchema.safeParse(rest);
      expect(r.success, `should reject missing "${key}"`).toBe(false);
    }
  });

  it('rejects an invalid email', () => {
    const r = appointmentSchema.safeParse({ ...validAppointment, email: 'nope' });
    expect(r.success).toBe(false);
  });
});
