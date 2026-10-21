import type { TemplateInfo } from '@forgekit/core';

import { CliArgumentError } from './args.js';

/**
 * Turns repeated `--config key=value` pairs into the object `@forgekit/core`
 * validates, coercing values using the template's field metadata so
 * `--config port=3000` becomes the number `3000` rather than the string.
 *
 * @throws CliArgumentError for malformed pairs or unknown keys.
 */
export function parseConfigPairs(
  pairs: readonly string[],
  template: TemplateInfo,
): Record<string, unknown> {
  const fields = new Map(template.configFields.map((field) => [field.key, field]));
  const config: Record<string, unknown> = {};

  for (const pair of pairs) {
    const equals = pair.indexOf('=');
    if (equals <= 0) {
      throw new CliArgumentError(`Invalid --config value "${pair}". Expected key=value.`);
    }
    const key = pair.slice(0, equals).trim();
    const raw = pair.slice(equals + 1);
    const field = fields.get(key);
    if (!field) {
      const allowed = template.configFields.map((entry) => entry.key).join(', ');
      throw new CliArgumentError(
        `Unknown option "${key}" for template "${template.id}". Allowed: ${allowed}.`,
      );
    }

    config[key] = coerceValue(key, raw, field);
  }

  return config;
}

function coerceValue(
  key: string,
  raw: string,
  field: TemplateInfo['configFields'][number],
): unknown {
  if (field.type === 'number') {
    if (!/^-?\d+$/.test(raw)) {
      throw new CliArgumentError(`Option "${key}" must be an integer, received "${raw}".`);
    }
    return Number(raw);
  }
  if (field.type === 'select' && field.options) {
    const values = field.options.map((option) => option.value);
    if (!values.includes(raw)) {
      throw new CliArgumentError(
        `Option "${key}" must be one of: ${values.join(', ')}. Received "${raw}".`,
      );
    }
    return raw;
  }
  return raw;
}
