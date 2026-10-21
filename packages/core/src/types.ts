import type {
  TemplateCategory,
  TemplateCommands,
  TemplateId,
  TemplateManifest,
} from '@forgekit/templates';

export type { TemplateCategory, TemplateCommands, TemplateId, TemplateManifest };

/** Package managers a generated project can be set up with. */
export type PackageManager = 'npm' | 'pnpm' | 'yarn';

/** Configuration accepted by the `react-vite` template. */
export interface ReactViteConfig {
  description: string;
  port: number;
  packageManager: PackageManager;
}

/** Configuration accepted by the `express-api` template. */
export interface ExpressApiConfig {
  description: string;
  port: number;
  corsOrigin: string;
  packageManager: PackageManager;
}

/** Configuration accepted by the `fullstack` template. */
export interface FullstackConfig {
  description: string;
  webPort: number;
  apiPort: number;
  packageManager: PackageManager;
}

/** Maps every template id to its validated configuration shape. */
export interface TemplateConfigMap {
  'react-vite': ReactViteConfig;
  'express-api': ExpressApiConfig;
  fullstack: FullstackConfig;
}

export type AnyTemplateConfig = TemplateConfigMap[TemplateId];
export type TemplateConfigFor<T extends TemplateId> = TemplateConfigMap[T];

/** Hard limits applied while reading templates and writing projects. */
export interface GenerationLimits {
  /** Maximum number of files copied from a template. */
  maxFiles: number;
  /** Maximum size of a single template file in bytes. */
  maxFileBytes: number;
  /** Maximum total size of generated output in bytes. */
  maxTotalBytes: number;
}

/** Default hard limits; small enough for the shipped templates, generous enough for new ones. */
export const DEFAULT_LIMITS: GenerationLimits = {
  maxFiles: 400,
  maxFileBytes: 2 * 1024 * 1024,
  maxTotalBytes: 8 * 1024 * 1024,
};

/** Input accepted by the generator. Fields marked optional have documented defaults. */
export interface ProjectOptions<C extends AnyTemplateConfig = AnyTemplateConfig> {
  /** Project (and directory) name, validated with `projectNameSchema`. */
  name: string;
  /** Allowlisted template identifier. */
  template: TemplateId;
  /**
   * Destination directory. Relative paths resolve against `process.cwd()`.
   * Defaults to `./<name>`.
   */
  targetDir?: string;
  /** Plan the generation without writing anything to disk. Defaults to `false`. */
  dryRun?: boolean;
  /** Permit writing into a non-empty destination directory. Defaults to `false`. */
  overwrite?: boolean;
  /** Template specific options; unknown keys are rejected. Missing keys use template defaults. */
  config?: Partial<C>;
}

/** Fully normalized options produced by `validateProjectOptions`. */
export interface ResolvedProjectOptions {
  name: string;
  /** npm-safe lowercase form of `name`, used as the `package.json` package name. */
  packageName: string;
  template: TemplateId;
  /** Destination directory exactly as provided (may be relative). */
  targetDir: string;
  dryRun: boolean;
  overwrite: boolean;
  /** Template configuration with every default applied and validated. */
  config: AnyTemplateConfig;
}

/** Result of a (possibly dry-run) generation. */
export interface GenerateResult {
  template: TemplateId;
  projectName: string;
  packageName: string;
  /** Destination directory exactly as provided in the resolved options. */
  targetDir: string;
  dryRun: boolean;
  /** Generated files as sorted POSIX-relative paths. */
  files: string[];
  fileCount: number;
  /** Total bytes written (0 for dry runs). */
  bytesWritten: number;
  /** Resolved configuration used for rendering. */
  config: AnyTemplateConfig;
  durationMs: number;
}

/** A single configurable option of a template, used to render forms. */
export interface TemplateConfigField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'select';
  help: string;
  placeholder?: string;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
}

/** Public catalog entry returned by `listTemplates()` and `getTemplateInfo()`. */
export interface TemplateInfo {
  id: TemplateId;
  templateVersion: string;
  name: string;
  summary: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  technologies: string[];
  setupRequirements: string[];
  /** Commands rendered with the template defaults (e.g. `pnpm run dev`). */
  commands: TemplateCommands;
  configFields: TemplateConfigField[];
  /** Default configuration for this template. */
  defaults: AnyTemplateConfig;
  /** Every file the template writes, as sorted POSIX-relative paths. */
  files: string[];
  fileCount: number;
  totalBytes: number;
}

/** A single file planned by the generator. */
export interface PlannedFile {
  /** POSIX-relative path inside the destination directory. */
  relativePath: string;
  /** Rendered contents. */
  contents: Uint8Array;
}
