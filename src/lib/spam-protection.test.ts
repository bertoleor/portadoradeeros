import { describe, expect, it } from 'vitest';

import {
  checkRateLimit,
  isHoneypotTriggered,
  resolveClientIp,
  SPAM_RATE_LIMIT,
} from '@/lib/spam-protection';

describe('spam-protection: honeypot', () => {
  it('rejects a filled honeypot field', () => {
    expect(isHoneypotTriggered('http://spam.example')).toBe(true);
    expect(isHoneypotTriggered(' x ')).toBe(true);
  });

  it('accepts an empty/whitespace honeypot (a real human)', () => {
    expect(isHoneypotTriggered('')).toBe(false);
    expect(isHoneypotTriggered(undefined)).toBe(false);
    expect(isHoneypotTriggered(null)).toBe(false);
    expect(isHoneypotTriggered('   ')).toBe(false);
    expect(isHoneypotTriggered(123)).toBe(false);
  });
});

describe('spam-protection: rate limit', () => {
  it('allows up to `max` requests then returns limited', () => {
    const cfg = { max: 3, windowMs: 60_000 };
    expect(checkRateLimit('scope-a', 'ip-unique-1', cfg).limited).toBe(false);
    expect(checkRateLimit('scope-a', 'ip-unique-1', cfg).limited).toBe(false);
    expect(checkRateLimit('scope-a', 'ip-unique-1', cfg).limited).toBe(false);
    const fourth = checkRateLimit('scope-a', 'ip-unique-1', cfg);
    expect(fourth.limited).toBe(true);
    expect(fourth.remaining).toBe(0);
    expect(fourth.resetAt).toBeGreaterThan(Date.now());
  });

  it('isolates counters per scope (a flood on one form does not lock another)', () => {
    const cfg = { max: 2, windowMs: 60_000 };
    checkRateLimit('appointments', 'ip-unique-2', cfg);
    checkRateLimit('appointments', 'ip-unique-2', cfg);
    expect(checkRateLimit('appointments', 'ip-unique-2', cfg).limited).toBe(true);
    // Same IP, different scope → unaffected.
    expect(checkRateLimit('contact', 'ip-unique-2', cfg).limited).toBe(false);
  });

  it('isolates counters per IP', () => {
    const cfg = { max: 1, windowMs: 60_000 };
    checkRateLimit('scope-b', 'ip-a', cfg);
    expect(checkRateLimit('scope-b', 'ip-a', cfg).limited).toBe(true);
    expect(checkRateLimit('scope-b', 'ip-b', cfg).limited).toBe(false);
  });

  it('prunes timestamps outside the sliding window', () => {
    // Window already elapsed: expired timestamps must not count against the cap.
    const cfg = { max: 1, windowMs: -1 }; // windowMs negative → cutoff in the future of `now`
    const first = checkRateLimit('scope-c', 'ip-unique-3', cfg);
    expect(first.limited).toBe(false);
    // With windowMs negative, every prior timestamp is already outside the window,
    // so the counter should never accumulate past 1.
    const second = checkRateLimit('scope-c', 'ip-unique-3', cfg);
    expect(second.limited).toBe(false);
  });

  it('reports remaining and resetAt on allowed requests', () => {
    const cfg = { max: 5, windowMs: 60_000 };
    const r = checkRateLimit('scope-d', 'ip-unique-4', cfg);
    expect(r.limited).toBe(false);
    expect(r.remaining).toBe(4);
    expect(r.resetAt).toBeGreaterThanOrEqual(Date.now());
  });

  it('SPAM_RATE_LIMIT default is a sane public-form cap', () => {
    expect(SPAM_RATE_LIMIT.max).toBeGreaterThan(0);
    expect(SPAM_RATE_LIMIT.windowMs).toBeGreaterThan(0);
  });
});

describe('spam-protection: client IP resolution', () => {
  it('reads the first x-forwarded-for hop', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.1' },
    });
    expect(resolveClientIp(req)).toBe('203.0.113.5');
  });

  it('falls back to x-real-ip', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '198.51.100.9' },
    });
    expect(resolveClientIp(req)).toBe('198.51.100.9');
  });

  it('falls back to a shared unknown bucket when no headers present', () => {
    const req = new Request('http://localhost');
    expect(resolveClientIp(req)).toBe('unknown');
  });
});
