/**
 * Lightweight, dependency-free anti-spam helpers for public POST endpoints.
 *
 * Two layers, deliberately cost-zero (no Redis, no external CAPTCHA):
 *
 * 1. HONEYPOT — a hidden form field that humans never fill. Bots that scrape
 *    the DOM and submit every input will populate it; a non-empty value is a
 *    strong signal of automation and the request is rejected silently
 *    (returning the same success shape so bots don't learn they were caught).
 *
 * 2. RATE LIMITING — a fixed in-memory sliding-window limiter keyed by IP.
 *    Tuned so a real human typing a couple of messages never trips it, while
 *    a scripted flood is cut off. Memory-only by design: it resets on deploy
 *    and does not coordinate across instances, which is the accepted trade-off
 *    for "nothing complex" hardening here.
 */

export interface RateLimitConfig {
  /** Maximum allowed requests within `windowMs`. */
  readonly max: number;
  /** Sliding window duration in milliseconds. */
  readonly windowMs: number;
}

interface WindowEntry {
  timestamps: number[];
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000;

/**
 * Result of a rate-limit check. `limited: true` means the caller must reject
 * the request (429) without performing any side-effects (email/DB writes).
 */
export interface RateLimitResult {
  readonly limited: boolean;
  /** Number of requests allowed before the window resets. `undefined` when not limited. */
  readonly remaining: number;
  /** Unix epoch ms until the current window fully expires. `undefined` when not limited. */
  readonly resetAt: number;
}

type LimiterRegistry = Map<string, Map<string, WindowEntry>>;

/**
 * Global in-memory store. Module-level so every route and server action in the
 * process shares the same counters (per-key windows), which keeps the total
 * memory footprint at O(distinct IPs x distinct endpoints) and lets the store
 * be pruned in place.
 */
const limiterStore: LimiterRegistry = new Map();

/**
 * Sliding-window rate limiter keyed by `(scope, ip)`.
 *
 * `scope` separates counters between endpoints (e.g. "contact" vs "appointments")
 * so a user who hits one form hard does not lock themselves out of another.
 */
export function checkRateLimit(
  scope: string,
  ip: string,
  config: RateLimitConfig = { max: 5, windowMs: RATE_LIMIT_WINDOW_MS }
): RateLimitResult {
  const now = Date.now();

  let ipMap = limiterStore.get(scope);
  if (ipMap === undefined) {
    ipMap = new Map<string, WindowEntry>();
    limiterStore.set(scope, ipMap);
  }

  let entry = ipMap.get(ip);
  if (entry === undefined) {
    entry = { timestamps: [] };
    ipMap.set(ip, entry);
  }

  // Prune timestamps outside the current sliding window.
  const cutoff = now - config.windowMs;
  const active = entry.timestamps.filter((t) => t > cutoff);
  entry.timestamps = active;

  if (active.length >= config.max) {
    const oldest = active[0] as number;
    return {
      limited: true,
      remaining: 0,
      resetAt: oldest + config.windowMs,
    };
  }

  entry.timestamps.push(now);

  return {
    limited: false,
    remaining: config.max - entry.timestamps.length,
    resetAt: now + config.windowMs,
  };
}

/**
 * Name of the hidden honeypot field. The client renders this input off-screen
 * (never `display:none` from the server, so basic bot detection still sees it)
 * and the handler rejects any request where it has a non-empty value.
 */
export const HONEYPOT_FIELD = 'company_website';

/**
 * True when the honeypot field is empty (a legit human submission) and thus the
 * request should be allowed. A filled honeypot means a bot tripped the trap.
 */
export function isHoneypotTriggered(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Resolve the client IP from a Next.js request. Reads the `x-forwarded-for`
 * chain (set by the platform/Vercel proxy) and falls back to a placeholder
 * when no header is present (e.g. local dev through `next dev`). The fallback
 * is a single shared bucket, so local/unknown clients share a counter rather
 * than each getting an unthrottled free pass.
 */
export function resolveClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0];
    if (first !== undefined && first.trim().length > 0) {
      return first.trim();
    }
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }

  return 'unknown';
}

/**
 * In-memory key collision risk when the same IP floods a single scope beyond
 * `max` within `windowMs`: `limited === true`. Otherwise a healthy request
 * returns with a non-negative `remaining`.
 */
export const SPAM_RATE_LIMIT: RateLimitConfig = {
  max: 5,
  windowMs: RATE_LIMIT_WINDOW_MS,
};
