/**
 * Structured error hierarchy for the ForgeKit generator.
 *
 * Every failure surfaced by `@forgekit/core` is a `ForgeKitError` with a stable
 * machine readable `code`, so the CLI and the web app can map failures to exit
 * codes and HTTP statuses without string matching.
 */

export type ForgeKitErrorCode =
  | 'VALIDATION_ERROR'
  | 'TEMPLATE_NOT_FOUND'
  | 'TEMPLATE_MANIFEST_INVALID'
  | 'TEMPLATE_RENDER_ERROR'
  | 'TARGET_NOT_DIRECTORY'
  | 'TARGET_NOT_EMPTY'
  | 'FILE_CONFLICT'
  | 'UNSAFE_PATH'
  | 'LIMIT_EXCEEDED'
  | 'ARCHIVE_ERROR'
  | 'IO_ERROR';

export interface ValidationIssue {
  /** Dotted path of the offending value, e.g. `config.port`. */
  path: string;
  message: string;
  /** Zod issue code when the issue originates from schema validation. */
  code?: string;
}

export interface ForgeKitErrorOptions {
  details?: Record<string, unknown>;
  cause?: unknown;
}

export class ForgeKitError extends Error {
  readonly code: ForgeKitErrorCode;
  readonly details: Record<string, unknown> | undefined;

  constructor(code: ForgeKitErrorCode, message: string, options: ForgeKitErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'ForgeKitError';
    this.code = code;
    this.details = options.details;
  }

  toJSON(): {
    name: string;
    code: ForgeKitErrorCode;
    message: string;
    details?: Record<string, unknown>;
  } {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}

export class ValidationError extends ForgeKitError {
  readonly issues: ValidationIssue[];

  constructor(message: string, issues: ValidationIssue[] = [], details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, details ? { details } : {});
    this.name = 'ValidationError';
    this.issues = issues;
  }

  override toJSON(): ReturnType<ForgeKitError['toJSON']> & { issues: ValidationIssue[] } {
    return { ...super.toJSON(), issues: this.issues };
  }
}

export class TemplateNotFoundError extends ForgeKitError {
  readonly templateId: string;

  constructor(templateId: string, available: readonly string[] = []) {
    super(
      'TEMPLATE_NOT_FOUND',
      `Template "${templateId}" does not exist.${
        available.length > 0 ? ` Available templates: ${available.join(', ')}.` : ''
      }`,
      { details: { templateId, available: [...available] } },
    );
    this.name = 'TemplateNotFoundError';
    this.templateId = templateId;
  }
}

export class TemplateManifestError extends ForgeKitError {
  readonly templateId: string;

  constructor(templateId: string, message: string, details?: Record<string, unknown>) {
    super('TEMPLATE_MANIFEST_INVALID', message, details ? { details } : {});
    this.name = 'TemplateManifestError';
    this.templateId = templateId;
  }
}

export class TargetDirectoryError extends ForgeKitError {
  constructor(
    code: 'TARGET_NOT_DIRECTORY' | 'TARGET_NOT_EMPTY',
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(code, message, details ? { details } : {});
    this.name = 'TargetDirectoryError';
  }
}

export class UnsafePathError extends ForgeKitError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('UNSAFE_PATH', message, details ? { details } : {});
    this.name = 'UnsafePathError';
  }
}

export class FileConflictError extends ForgeKitError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('FILE_CONFLICT', message, details ? { details } : {});
    this.name = 'FileConflictError';
  }
}

export class LimitExceededError extends ForgeKitError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('LIMIT_EXCEEDED', message, details ? { details } : {});
    this.name = 'LimitExceededError';
  }
}

export class TemplateRenderError extends ForgeKitError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('TEMPLATE_RENDER_ERROR', message, details ? { details } : {});
    this.name = 'TemplateRenderError';
  }
}

export class ArchiveError extends ForgeKitError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('ARCHIVE_ERROR', message, details ? { details } : {});
    this.name = 'ArchiveError';
  }
}

export function isForgeKitError(error: unknown): error is ForgeKitError {
  return error instanceof ForgeKitError;
}

/** Wraps an unknown throwable into a `ForgeKitError` without losing the cause. */
export function toForgeKitError(
  error: unknown,
  fallbackMessage = 'Unexpected error',
): ForgeKitError {
  if (isForgeKitError(error)) return error;
  if (error instanceof Error) {
    return new ForgeKitError('IO_ERROR', error.message, { cause: error });
  }
  return new ForgeKitError('IO_ERROR', `${fallbackMessage}: ${String(error)}`);
}
