import {
  getTemplateContentDir,
  getTemplateDir,
  isTemplateId,
  listTemplateIds,
  readTemplateJson,
} from '@forgekit/templates';
import { z } from 'zod';

import { TemplateManifestError, TemplateNotFoundError } from './errors.js';
import { walkDirectory } from './fs-utils.js';
import { renderTemplate } from './render.js';
import { buildTemplateVariables, configFields, defaultConfigs } from './template-config.js';
import { renameTemplatePath } from './template-paths.js';
import {
  DEFAULT_LIMITS,
  type GenerationLimits,
  type TemplateInfo,
  type TemplateManifest,
} from './types.js';

/**
 * Schema of `template.json`.
 *
 * Kept in code rather than inferred from the JSON so a malformed manifest
 * produces a structured error naming the offending field.
 */
export const manifestSchema = z.object({
  id: z.string().trim().min(1),
  templateVersion: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, 'templateVersion must be semver, for example "1.0.0"'),
  name: z.string().trim().min(1).max(80),
  summary: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
  category: z.enum(['frontend', 'backend', 'fullstack']),
  tags: z.array(z.string().trim().min(1)),
  technologies: z.array(z.string().trim().min(1)),
  setupRequirements: z.array(z.string().trim().min(1)),
  commands: z.object({
    dev: z.string().trim().min(1),
    build: z.string().trim().min(1),
    typecheck: z.string().trim().min(1),
  }),
});

/** Parses a raw `template.json` payload and verifies the id matches its directory. */
export function parseManifest(templateId: string, raw: unknown): TemplateManifest {
  const declaredId =
    typeof raw === 'object' && raw !== null && 'id' in raw
      ? (raw as { id: unknown }).id
      : undefined;
  if (typeof declaredId === 'string' && declaredId !== templateId) {
    throw new TemplateManifestError(
      templateId,
      `Template manifest id "${declaredId}" does not match its directory "${templateId}".`,
      { templateId, manifestId: declaredId },
    );
  }

  const result = manifestSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.map(String).join('.') || '<root>'}: ${issue.message}`)
      .join('; ');
    throw new TemplateManifestError(
      templateId,
      `Template manifest for "${templateId}" is invalid: ${issues}`,
      { templateId, issues: result.error.issues.map((issue) => issue.message) },
    );
  }
  const manifest = result.data as TemplateManifest;
  if (manifest.id !== templateId) {
    throw new TemplateManifestError(
      templateId,
      `Template manifest id "${manifest.id}" does not match its directory "${templateId}".`,
      { templateId, manifestId: manifest.id },
    );
  }
  return manifest;
}

export interface TemplateRegistryOptions {
  limits?: GenerationLimits;
}

/**
 * Loads a manifest and describes one template for the catalog.
 *
 * Walking the content directory here means each catalog read also proves the
 * template respects the path and size limits.
 */
export async function getTemplateInfo(
  templateId: string,
  options: TemplateRegistryOptions = {},
): Promise<TemplateInfo> {
  if (!isTemplateId(templateId)) {
    throw new TemplateNotFoundError(templateId, listTemplateIds());
  }
  const limits = options.limits ?? DEFAULT_LIMITS;
  const manifest = parseManifest(templateId, await readTemplateJson(templateId));
  const walked = await walkDirectory(getTemplateContentDir(templateId), limits);
  const files = walked
    .map((file) => ({ ...file, relativePath: renameTemplatePath(file.relativePath) }))
    .sort((a, b) =>
      a.relativePath < b.relativePath ? -1 : a.relativePath > b.relativePath ? 1 : 0,
    );
  const defaults = defaultConfigs[templateId];
  const sampleName = templateId.replace(/[^a-z0-9-]/g, '-');
  const variables = buildTemplateVariables(sampleName, samplePackageName(templateId), defaults);
  const manifestPath = `${templateId}/template.json`;

  return {
    id: templateId,
    templateVersion: manifest.templateVersion,
    name: manifest.name,
    summary: manifest.summary,
    description: manifest.description,
    category: manifest.category,
    tags: [...manifest.tags],
    technologies: [...manifest.technologies],
    setupRequirements: [...manifest.setupRequirements],
    commands: {
      dev: renderTemplate(manifest.commands.dev, variables, manifestPath),
      build: renderTemplate(manifest.commands.build, variables, `${templateId}/template.json`),
      typecheck: renderTemplate(
        manifest.commands.typecheck,
        variables,
        `${templateId}/template.json`,
      ),
    },
    configFields: configFields[templateId].map((field) => ({ ...field })),
    defaults: defaultConfigs[templateId],
    files: files.map((file) => file.relativePath),
    fileCount: files.length,
    totalBytes: files.reduce((total, file) => total + file.size, 0),
  };
}

/** Returns every template in catalog order. */
export async function listTemplates(
  options: TemplateRegistryOptions = {},
): Promise<TemplateInfo[]> {
  const infos: TemplateInfo[] = [];
  for (const templateId of listTemplateIds()) {
    infos.push(await getTemplateInfo(templateId, options));
  }
  return infos;
}

/** Resolves a template directory, translating unknown ids into `TemplateNotFoundError`. */
export function requireTemplateContentDir(templateId: string): string {
  if (!isTemplateId(templateId)) {
    throw new TemplateNotFoundError(templateId, listTemplateIds());
  }
  return getTemplateContentDir(templateId);
}

/** Absolute path of a template directory, translating unknown ids into `TemplateNotFoundError`. */
export function requireTemplateDir(templateId: string): string {
  if (!isTemplateId(templateId)) {
    throw new TemplateNotFoundError(templateId, listTemplateIds());
  }
  return getTemplateDir(templateId);
}

/** Re-exported so consumers of `@forgekit/core` can narrow template ids without extra imports. */
export { isTemplateId };

function samplePackageName(templateId: string): string {
  return templateId.replace(/[^a-z0-9-]/g, '-');
}
