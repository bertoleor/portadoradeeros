import { describe, it, expect } from 'vitest';
import { AppError, ok, fail } from './error';

describe('Result/AppError contract', () => {
  it('ok() returns ok:true with the payload', () => {
    expect(ok(42)).toEqual({ ok: true, data: 42 });
  });

  it('fail() returns ok:false with the AppError', () => {
    const err = new AppError('DB', 'connection refused');
    expect(fail<number>(err)).toEqual({ ok: false, error: err });
  });

  it('AppError exposes code, message and name', () => {
    const err = new AppError('UNAUTHORIZED', 'not an admin');
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.message).toBe('not an admin');
    expect(err.name).toBe('AppError');
    expect(err).toBeInstanceOf(Error);
  });
});