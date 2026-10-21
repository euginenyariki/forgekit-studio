import type { TemplateId } from './ids.js';

/**
 * Structural description of every `template.json` shipped in `templates/`.
 *
 * The package intentionally has no runtime dependencies beyond Node built-ins:
 * it only exposes file-system locations and raw manifest JSON. Validation with
 * Zod lives in `@forgekit/core`, which type-checks its schema output against
 * this interface so metadata drift fails the build.
 */

export type TemplateCategory = 'frontend' | 'backend' | 'fullstack';

export interface TemplateCommands {
  /** Command that starts the development servers, e.g. `{{packageManager}} run dev`. */
  dev: string;
  /** Command that type-checks and builds the project. */
  build: string;
  /** Command that runs the TypeScript compiler without emitting. */
  typecheck: string;
}

export interface TemplateManifest {
  /** Must equal the directory name that contains the template. */
  id: TemplateId;
  /** Human readable template version (semver). */
  templateVersion: string;
  /** Display name, e.g. "React + Vite". */
  name: string;
  /** One sentence used on cards and in the CLI list output. */
  summary: string;
  /** Longer paragraph used on the template detail page. */
  description: string;
  category: TemplateCategory;
  tags: string[];
  /** Technologies shown as badges, e.g. ["React 19", "Vite 8"]. */
  technologies: string[];
  /** Prerequisites the user needs before running the generated project. */
  setupRequirements: string[];
  commands: TemplateCommands;
}
