import type { ZodType } from 'zod';

/** Error carrying an HTTP status code, translated by the app error handler. */
export class HttpError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export function notFound(message: string): HttpError {
  return new HttpError(404, message);
}

/**
 * Validates a request payload.
 *
 * @throws HttpError with status 400 and per-field issues when the payload is invalid.
 */
export function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new HttpError(
      400,
      'Payload validation failed',
      result.error.issues.map((issue) => ({
        path: issue.path.map(String).join('.') || '<root>',
        message: issue.message,
      })),
    );
  }
  return result.data;
}
