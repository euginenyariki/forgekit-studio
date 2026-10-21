/**
 * Public API of the ForgeKit generator engine (Node.js runtime).
 *
 * The engine is split in two layers:
 * - pure modules (schema, validation, rendering) that also ship through the
 *   client-safe `@forgekit/core/schema` entry point;
 * - filesystem modules (registry, generator, archive) available only here.
 */
export * from './schema.js';

export {
  getTemplateInfo,
  listTemplates,
  manifestSchema,
  parseManifest,
  requireTemplateContentDir,
  requireTemplateDir,
} from './registry.js';
export { createArchive, createArchiveBuffer } from './archive.js';
export {
  generateProject,
  planFiles,
  planProject,
  writeProject,
  type GenerateOptions,
  type PlanOptions,
  renameTemplatePath,
  TEMPLATE_FILE_RENAMES,
  type PlannedFileSummary,
  type ProjectPlan,
} from './generator.js';
export {
  assertSafeRelativePath,
  resolveInside,
  toPosixRelative,
  walkDirectory,
  type WalkedFile,
} from './fs-utils.js';
