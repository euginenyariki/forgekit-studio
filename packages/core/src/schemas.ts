import { TEMPLATE_IDS, isTemplateId } from '@forgekit/templates/ids';
import { z } from 'zod';

import { TemplateNotFoundError, ValidationError } from './errors.js';
import { resolveConfig } from './template-config.js';
import type { ProjectOptions, ResolvedProjectOptions } from './types.js';
import { parseStrict } from './validation.js';

/**
 * Project names double as directory names, so they accept letters, digits,
 * dot, dash and underscore, and must start with a letter or a digit.
 */
export const projectNameSchema = z
  .string({ error: 'name must be a string' })
  .trim()
  .min(1, 'name must not be empty')
  .max(64, 'name must be 64 characters or fewer')
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/,
    'name must start with a letter or digit and may only contain letters, digits, ".", "-" and "_"',
  )
  .refine((value) => !value.includes('..'), {
    message: 'name must not contain ".."',
  })
  .refine((value) => !value.includes('{{'), {
    message: 'name must not contain "{{"',
  })
  .refine((value) => !/[.\-_]$/.test(value), {
    message: 'name must not end with ".", "-" or "_"',
  });

const projectOptionsInputSchema = z.object({
  name: projectNameSchema,
  template: z.string({ error: 'template must be a string' }).min(1, 'template must not be empty'),
  targetDir: z
    .string({ error: 'targetDir must be a string' })
    .min(1, 'targetDir must not be empty')
    .refine((value) => !value.includes('\0'), { message: 'targetDir must not contain null bytes' })
    .optional(),
  dryRun: z.boolean({ error: 'dryRun must be a boolean' }).default(false),
  overwrite: z.boolean({ error: 'overwrite must be a boolean' }).default(false),
  config: z.unknown().optional(),
});

export const PROJECT_OPTION_KEYS: readonly string[] = [
  'name',
  'template',
  'targetDir',
  'dryRun',
  'overwrite',
  'config',
];

/**
 * Converts a project name into a valid npm package name.
 *
 * Lowercases, replaces whitespace and unsupported characters with dashes, and
 * trims leading/trailing separators so the result is url-safe and <= 214 chars.
 *
 * @throws ValidationError when the name cannot be converted to anything usable.
 */
export function toPackageName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[._-]+/, '')
    .replace(/[._-]+$/, '')
    .slice(0, 214);
  if (slug.length === 0) {
    throw new ValidationError('name cannot be converted into a package name', [
      { path: 'name', message: 'name produces an empty package name', code: 'invalid_name' },
    ]);
  }
  return slug;
}

/**
 * Validates and normalizes generator input.
 *
 * The public input type is `ProjectOptions`, but validation accepts `unknown`
 * because CLI arguments and API request bodies arrive untrusted.
 *
 * @throws ValidationError for shape/type problems.
 * @throws TemplateNotFoundError when the template id is not shipped.
 */
export function validateProjectOptions(input: unknown): ResolvedProjectOptions {
  const parsed = parseStrict(projectOptionsInputSchema, input, {
    pathPrefix: '',
    context: 'Invalid project options',
    allowedKeys: PROJECT_OPTION_KEYS,
  });

  if (!isTemplateId(parsed.template)) {
    throw new TemplateNotFoundError(parsed.template, TEMPLATE_IDS);
  }

  const config = resolveConfig(parsed.template, parsed.config);

  return {
    name: parsed.name,
    packageName: toPackageName(parsed.name),
    template: parsed.template,
    targetDir: parsed.targetDir ?? parsed.name,
    dryRun: parsed.dryRun,
    overwrite: parsed.overwrite,
    config,
  };
}

/** Typed alias of `validateProjectOptions` for callers that already hold `ProjectOptions`. */
export function validateOptions(input: ProjectOptions): ResolvedProjectOptions {
  return validateProjectOptions(input);
}
