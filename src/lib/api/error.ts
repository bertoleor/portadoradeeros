export type ErrorCode = 'UNAUTHORIZED' | 'VALIDATION' | 'DB' | 'NOT_FOUND';

/**
 * Unified application error for the API layer.
 *
 * Replaces the previous mix of `{ success, error }` returns and silent `[]`
 * fail-open paths with a single throw contract that an error boundary can catch.
 */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    msg: string,
  ) {
    super(msg);
    this.name = 'AppError';
  }
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail<T>(error: AppError): Result<T> {
  return { ok: false, error };
}