import type { z } from 'zod';

import { ValidationError, type ValidationIssue } from './errors.js';

/** Converts Zod issues into ForgeKit validation issues under a dotted prefix. */
export function zodIssuesToValidationIssues(prefix: string, error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => {
    const segments = issue.path.map(String).join('.');
    const path =
      segments.length > 0 ? (prefix ? `${prefix}.${segments}` : segments) : prefix || '<root>';
    return { path, message: issue.message, code: issue.code };
  });
}

/** Throws a `ValidationError` when `input` has keys outside `allowedKeys`. */
export function assertNoUnknownKeys(
  input: Record<string, unknown>,
  allowedKeys: Iterable<string>,
  pathPrefix: string,
  context: string,
): void {
  const allowed = new Set(allowedKeys);
  const unknown = Object.keys(input).filter((key) => !allowed.has(key));
  if (unknown.length === 0) return;
  throw new ValidationError(
    context,
    unknown.map((key) => ({
      path: pathPrefix ? `${pathPrefix}.${key}` : key,
      message: `Unknown option "${key}". Allowed: ${[...allowed].join(', ')}.`,
      code: 'unrecognized_keys',
    })),
  );
}

/**
 * Parses `input` with `schema` after rejecting unknown keys.
 *
 * `allowedKeys` must be provided explicitly (usually `Object.keys(schema.shape)`)
 * so the helper works with any Zod schema, not only objects.
 *
 * @throws ValidationError with one issue per unknown key or per Zod issue.
 */
export function parseStrict<T extends z.ZodType>(
  schema: T,
  input: unknown,
  options: { pathPrefix: string; context: string; allowedKeys: Iterable<string> },
): z.output<T> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new ValidationError(options.context, [
      {
        path: options.pathPrefix,
        message: 'must be a plain object',
        code: 'invalid_type',
      },
    ]);
  }
  const record = input as Record<string, unknown>;
  assertNoUnknownKeys(record, options.allowedKeys, options.pathPrefix, options.context);
  const parsed = schema.safeParse(record);
  if (!parsed.success) {
    throw new ValidationError(
      options.context,
      zodIssuesToValidationIssues(options.pathPrefix, parsed.error),
    );
  }
  return parsed.data;
}
