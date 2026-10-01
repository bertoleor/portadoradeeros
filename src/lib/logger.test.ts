import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * EROS-D5: logger must be observable in production.
 * warn/error always emit (dev-only gate removed); info/debug stay dev-only.
 * Module-level `isDevelopment` is captured at import time, so each scenario
 * re-imports a fresh logger via vi.resetModules() under the target NODE_ENV.
 */

const setNodeEnv = (value: string | undefined) => {
  // NODE_ENV is typed read-only by @types/node; tests need to flip it.
  (process.env as { NODE_ENV?: string }).NODE_ENV = value;
};

const loadLogger = async (env: string) => {
  const prev = process.env.NODE_ENV;
  setNodeEnv(env);
  try {
    vi.resetModules();
    return { logger: (await import('@/lib/logger')).logger, prev };
  } catch (e) {
    setNodeEnv(prev);
    throw e;
  }
};

describe('logger (EROS-D5: prod observability)', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let debugSpy: ReturnType<typeof vi.spyOn>;
  let prevEnv: string | undefined;

  const spy = (method: 'error' | 'warn' | 'info' | 'debug') =>
    vi.spyOn(console, method).mockImplementation(() => {});

  beforeEach(() => {
    vi.restoreAllMocks();
    prevEnv = process.env.NODE_ENV;
    errorSpy = spy('error');
    warnSpy = spy('warn');
    infoSpy = spy('info');
    debugSpy = spy('debug');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setNodeEnv(prevEnv);
    vi.resetModules();
  });

  it('error emits in production (no dev gate)', async () => {
    const { logger } = await loadLogger('production');
    logger.error('insert failed', { table: 'contact_messages' });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const out = errorSpy.mock.calls[0]?.[0] as string;
    expect(out).toContain('[ERROR]');
    expect(out).toContain('insert failed');
    expect(out).toContain('contact_messages');
  });

  it('warn emits in production', async () => {
    const { logger } = await loadLogger('production');
    logger.warn('degraded path');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0]?.[0])).toContain('[WARN]');
  });

  it('info stays dev-only (silent in production)', async () => {
    const { logger } = await loadLogger('production');
    logger.info('userland noise');
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it('debug stays dev-only (silent in production)', async () => {
    const { logger } = await loadLogger('production');
    logger.debug('trace noise');
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('all levels emit in development', async () => {
    const { logger } = await loadLogger('development');
    logger.info('i');
    logger.warn('w');
    logger.error('e');
    logger.debug('d');
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(debugSpy).toHaveBeenCalledTimes(1);
  });

  it('structured format keeps ISO timestamp + level + context', async () => {
    const { logger } = await loadLogger('production');
    logger.error('boom', { code: 500 });
    const out = String(errorSpy.mock.calls[0]?.[0]);
    expect(out).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(out).toContain('[ERROR] boom | {"code":500}');
  });

  it('error without context omits the context pipe', async () => {
    const { logger } = await loadLogger('production');
    logger.error('plain');
    expect(String(errorSpy.mock.calls[0]?.[0])).not.toContain('|');
  });
});
