import { getTemplateInfo } from '@forgekit/core';
import type { TemplateConfigField } from '@forgekit/core/schema';

/** Loosely typed project input coming from a JSON body, a form or a test. */
export interface RawProjectInput {
  name?: unknown;
  template?: unknown;
  targetDir?: unknown;
  dryRun?: unknown;
  overwrite?: unknown;
  config?: Record<string, unknown>;
}

function asBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === 'on' || value === '1';
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

/**
 * Coerces loosely typed config values into the shapes expected by a template.
 *
 * Form submissions arrive as strings while JSON bodies may already be typed, so
 * numbers are parsed and everything else is stringified. Empty values are
 * dropped so template defaults apply.
 */
export function coerceConfigValues(
  fields: TemplateConfigField[],
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const config: Record<string, unknown> = {};
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(raw, field.key)) continue;
    const value = raw[field.key];
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value.trim() === '') continue;

    if (field.type === 'number') {
      const parsed = typeof value === 'number' ? value : Number(String(value).trim());
      if (Number.isFinite(parsed)) config[field.key] = parsed;
      continue;
    }

    const text = String(value);
    if (text.trim() !== '') config[field.key] = text;
  }
  return config;
}

/**
 * Normalizes raw studio input into the object accepted by the generator.
 *
 * Resolves the template first so config values can be coerced against its field
 * definitions; unknown templates throw a `TemplateNotFoundError`.
 */
export async function buildProjectRequest(raw: RawProjectInput): Promise<Record<string, unknown>> {
  const template = asOptionalString(raw.template) ?? '';
  const info = await getTemplateInfo(template);
  const config = coerceConfigValues(info.configFields, raw.config ?? {});
  const targetDir = asOptionalString(raw.targetDir);

  return {
    name: asOptionalString(raw.name) ?? '',
    template,
    config,
    ...(targetDir ? { targetDir } : {}),
    ...(asBoolean(raw.dryRun) ? { dryRun: true } : {}),
    ...(asBoolean(raw.overwrite) ? { overwrite: true } : {}),
  };
}

/** Reads a project request out of an HTML form submission. */
export function formToRawProject(form: FormData): RawProjectInput {
  const config: Record<string, unknown> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value !== 'string' || !key.startsWith('config.')) continue;
    config[key.slice('config.'.length)] = value;
  }
  return {
    name: form.get('name'),
    template: form.get('template'),
    targetDir: form.get('targetDir'),
    overwrite: form.get('overwrite'),
    config,
  };
}
