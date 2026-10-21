import { isForgeKitError } from '@forgekit/core';
import type { ForgeKitErrorCode } from '@forgekit/core/schema';

/** Maps generator error codes to HTTP status codes for the studio API. */
export function statusForCode(code: ForgeKitErrorCode): number {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 400;
    case 'TEMPLATE_NOT_FOUND':
      return 404;
    case 'TARGET_NOT_EMPTY':
    case 'TARGET_NOT_DIRECTORY':
    case 'FILE_CONFLICT':
      return 409;
    case 'LIMIT_EXCEEDED':
      return 413;
    case 'UNSAFE_PATH':
      return 400;
    default:
      return 500;
  }
}

export interface ApiErrorBody {
  error: {
    code: ForgeKitErrorCode | 'INTERNAL_ERROR';
    message: string;
    details?: Record<string, unknown>;
  };
}

/** Converts any thrown value into a JSON error response. */
export function errorResponse(error: unknown): Response {
  if (isForgeKitError(error)) {
    const body: ApiErrorBody = {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    };
    return Response.json(body, { status: statusForCode(error.code) });
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error.';
  const body: ApiErrorBody = { error: { code: 'INTERNAL_ERROR', message } };
  return Response.json(body, { status: 500 });
}
