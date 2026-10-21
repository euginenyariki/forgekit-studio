import type { TemplateId } from '@forgekit/templates';
import { z } from 'zod';

import type {
  AnyTemplateConfig,
  ExpressApiConfig,
  FullstackConfig,
  PackageManager,
  ReactViteConfig,
  TemplateConfigField,
  TemplateConfigMap,
} from './types.js';
import type { TemplateVariables } from './render.js';
import { parseStrict } from './validation.js';

/**
 * Per-template configuration contracts.
 *
 * Schemas are stored here rather than in the manifest JSON because defaults and
 * form metadata are code, not template content. `tests/manifest.test.ts` keeps
 * `template.json` in sync with these types.
 */

export const packageManagerSchema = z.enum(['npm', 'pnpm', 'yarn']);

/**
 * Descriptions are interpolated into JSON, HTML attributes and Markdown, so
 * they may not contain characters that would need escaping in any of them.
 */
const descriptionSchema = z
  .string()
  .trim()
  .min(1, 'description must not be empty')
  .max(160, 'description must be 160 characters or fewer')
  .refine((value) => !value.includes('{{') && !value.includes('}}'), {
    message: 'description must not contain "{{" or "}}"',
  })
  .refine((value) => !/[\\"<>]/.test(value), {
    message: 'description must not contain quotes, backslashes or angle brackets',
  })
  .refine((value) => !hasControlChars(value), {
    message: 'description must not contain control characters',
  });

/** True when `value` contains a C0 control character (including a null byte). */
function hasControlChars(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    if (code < 32 || code === 127) return true;
  }
  return false;
}

const portSchema = z
  .number({ error: 'port must be a number' })
  .int('port must be an integer')
  .min(1, 'port must be at least 1')
  .max(65535, 'port must be at most 65535');

const corsOriginSchema = z
  .string()
  .trim()
  .min(1, 'corsOrigin must not be empty')
  .max(200, 'corsOrigin must be 200 characters or fewer')
  .refine((value) => value === '*' || value === 'null' || /^https?:\/\/[^\s]+$/.test(value), {
    message: 'corsOrigin must be "*", "null", or an http(s) origin such as http://localhost:5173',
  });

export const reactViteConfigSchema = z.object({
  description: descriptionSchema.default('A React app generated with ForgeKit.'),
  port: portSchema.default(5173),
  packageManager: packageManagerSchema.default('npm'),
});

export const expressApiConfigSchema = z.object({
  description: descriptionSchema.default('An Express API generated with ForgeKit.'),
  port: portSchema.default(4000),
  corsOrigin: corsOriginSchema.default('http://localhost:5173'),
  packageManager: packageManagerSchema.default('npm'),
});

export const fullstackConfigSchema = z.object({
  description: descriptionSchema.default('A full-stack app generated with ForgeKit.'),
  webPort: portSchema.default(5173),
  apiPort: portSchema.default(4000),
  packageManager: packageManagerSchema.default('npm'),
});

export const configSchemas = {
  'react-vite': reactViteConfigSchema,
  'express-api': expressApiConfigSchema,
  fullstack: fullstackConfigSchema,
} as const satisfies { [K in TemplateId]: z.ZodType<TemplateConfigMap[K]> };

export const defaultConfigs = {
  'react-vite': reactViteConfigSchema.parse({}),
  'express-api': expressApiConfigSchema.parse({}),
  fullstack: fullstackConfigSchema.parse({}),
} as const satisfies { [K in TemplateId]: TemplateConfigMap[K] };

/** Fields rendered as form inputs by the studio and described by `forgekit config --help`. */
export const configFields: { [K in TemplateId]: TemplateConfigField[] } = {
  'react-vite': [
    {
      key: 'description',
      label: 'Description',
      type: 'string',
      help: 'Written to package.json and shown in the project header.',
      placeholder: 'A React app generated with ForgeKit.',
      required: false,
      maxLength: 160,
    },
    {
      key: 'port',
      label: 'Dev server port',
      type: 'number',
      help: 'Port used by the Vite development server.',
      required: false,
      min: 1,
      max: 65535,
    },
    {
      key: 'packageManager',
      label: 'Package manager',
      type: 'select',
      help: 'Used for install and run instructions in generated docs.',
      required: false,
      options: packageManagerOptions(),
    },
  ],
  'express-api': [
    {
      key: 'description',
      label: 'Description',
      type: 'string',
      help: 'Written to package.json and shown in the project header.',
      placeholder: 'An Express API generated with ForgeKit.',
      required: false,
      maxLength: 160,
    },
    {
      key: 'port',
      label: 'API port',
      type: 'number',
      help: 'Port the Express server listens on.',
      required: false,
      min: 1,
      max: 65535,
    },
    {
      key: 'corsOrigin',
      label: 'CORS origin',
      type: 'string',
      help: 'Origin allowed by the API. Use "*" to allow any origin.',
      placeholder: 'http://localhost:5173',
      required: false,
      maxLength: 200,
    },
    {
      key: 'packageManager',
      label: 'Package manager',
      type: 'select',
      help: 'Used for install and run instructions in generated docs.',
      required: false,
      options: packageManagerOptions(),
    },
  ],
  fullstack: [
    {
      key: 'description',
      label: 'Description',
      type: 'string',
      help: 'Written to package.json and shown in the project header.',
      placeholder: 'A full-stack app generated with ForgeKit.',
      required: false,
      maxLength: 160,
    },
    {
      key: 'webPort',
      label: 'Web port',
      type: 'number',
      help: 'Port used by the Vite development server.',
      required: false,
      min: 1,
      max: 65535,
    },
    {
      key: 'apiPort',
      label: 'API port',
      type: 'number',
      help: 'Port the Express server listens on.',
      required: false,
      min: 1,
      max: 65535,
    },
    {
      key: 'packageManager',
      label: 'Package manager',
      type: 'select',
      help: 'Used for install and run instructions in generated docs.',
      required: false,
      options: packageManagerOptions(),
    },
  ],
};

function packageManagerOptions(): { value: string; label: string }[] {
  return [
    { value: 'npm', label: 'npm' },
    { value: 'pnpm', label: 'pnpm' },
    { value: 'yarn', label: 'yarn' },
  ];
}

/**
 * Validates template specific configuration and applies documented defaults.
 *
 * Unknown configuration keys are rejected instead of silently stripped, so a
 * typo in the CLI or the studio form is reported rather than ignored.
 *
 * @throws ValidationError when the configuration is invalid.
 */
export function resolveConfig<T extends TemplateId>(
  template: T,
  input: unknown = {},
): TemplateConfigMap[T] {
  if (input === undefined || input === null) {
    return defaultConfigs[template] as TemplateConfigMap[T];
  }
  const schema = configSchemas[template];
  return parseStrict(schema, input, {
    pathPrefix: 'config',
    context: `Invalid configuration for template "${template}"`,
    allowedKeys: Object.keys(schema.shape),
  }) as TemplateConfigMap[T];
}

/** The install command documented for a package manager, e.g. `pnpm install`. */
export function installCommandFor(packageManager: PackageManager): string {
  return `${packageManager} install`;
}

/** The run command documented for a package manager, e.g. `pnpm run dev`. */
export function runCommandFor(packageManager: PackageManager): string {
  return `${packageManager} run dev`;
}

/** Per-template configuration types re-exported for consumers of the CLI and studio. */
export type { ExpressApiConfig, FullstackConfig, ReactViteConfig };

/**
 * Builds the placeholder value map for a template.
 *
 * Only variables that apply to the template are present, so a template file
 * that references `{{apiPort}}` while its template has no such option fails
 * loudly instead of rendering an empty string.
 */
export function buildTemplateVariables(
  name: string,
  packageName: string,
  config: AnyTemplateConfig,
): TemplateVariables {
  const variables: TemplateVariables = {
    projectName: name,
    packageName,
    description: config.description,
    packageManager: config.packageManager,
    installCommand: installCommandFor(config.packageManager),
    runCommand: `${config.packageManager} run`,
  };
  if ('port' in config) variables.port = config.port;
  if ('webPort' in config) variables.webPort = config.webPort;
  if ('apiPort' in config) variables.apiPort = config.apiPort;
  if ('corsOrigin' in config) variables.corsOrigin = config.corsOrigin;
  return variables;
}
