import { lstat, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  FileConflictError,
  LimitExceededError,
  TargetDirectoryError,
  TemplateRenderError,
  toForgeKitError,
} from './errors.js';
import { resolveInside, walkDirectory } from './fs-utils.js';
import { renderTemplate } from './render.js';
import { requireTemplateContentDir } from './registry.js';
import { validateProjectOptions } from './schemas.js';
import { renameTemplatePath } from './template-paths.js';
import { buildTemplateVariables } from './template-config.js';
import {
  DEFAULT_LIMITS,
  type GenerateResult,
  type GenerationLimits,
  type PlannedFile,
  type ResolvedProjectOptions,
} from './types.js';

export interface PlanOptions {
  limits?: GenerationLimits;
}

export { TEMPLATE_FILE_RENAMES, renameTemplatePath } from './template-paths.js';

/** A planned file with its byte size, safe to serialize for previews. */
export interface PlannedFileSummary {
  relativePath: string;
  size: number;
}

export interface ProjectPlan {
  resolved: ResolvedProjectOptions;
  /** Absolute destination directory. */
  targetDir: string;
  files: PlannedFileSummary[];
  fileCount: number;
  totalBytes: number;
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await lstat(target);
    return true;
  } catch {
    return false;
  }
}

/**
 * Renders every template file in memory.
 *
 * Reading and rendering everything before touching the destination means a
 * template error can never leave a half written project behind.
 */
export async function planFiles(
  resolved: ResolvedProjectOptions,
  limits: GenerationLimits = DEFAULT_LIMITS,
): Promise<{ files: PlannedFile[]; totalBytes: number }> {
  const contentDir = requireTemplateContentDir(resolved.template);
  const walked = await walkDirectory(contentDir, limits);
  const variables = buildTemplateVariables(resolved.name, resolved.packageName, resolved.config);

  const seen = new Map<string, string>();
  const files: PlannedFile[] = [];
  let totalBytes = 0;

  for (const walkedFile of walked) {
    const relativePath = renameTemplatePath(walkedFile.relativePath);
    const conflicting = seen.get(relativePath.toLowerCase());
    if (conflicting) {
      throw new FileConflictError(
        `Template produces two paths that differ only by case: "${conflicting}" and "${relativePath}".`,
        { first: conflicting, second: relativePath },
      );
    }
    seen.set(relativePath.toLowerCase(), relativePath);

    const raw = await readFile(walkedFile.absolutePath);
    if (raw.includes(0)) {
      throw new TemplateRenderError(
        `Template file "${relativePath}" looks binary; only UTF-8 text templates are supported.`,
        { relativePath },
      );
    }
    const rendered = Buffer.from(
      renderTemplate(raw.toString('utf8'), variables, relativePath),
      'utf8',
    );
    totalBytes += rendered.byteLength;
    if (totalBytes > limits.maxTotalBytes) {
      throw new LimitExceededError(
        `Generated output is larger than the ${limits.maxTotalBytes} byte limit.`,
        { limit: limits.maxTotalBytes, totalBytes },
      );
    }
    files.push({ relativePath, contents: rendered });
  }

  files.sort((a, b) =>
    a.relativePath < b.relativePath ? -1 : a.relativePath > b.relativePath ? 1 : 0,
  );

  return { files, totalBytes };
}

/** Plans a project without writing anything to disk. */
export async function planProject(input: unknown, options: PlanOptions = {}): Promise<ProjectPlan> {
  const resolved = validateProjectOptions(input);
  const limits = options.limits ?? DEFAULT_LIMITS;
  const { files, totalBytes } = await planFiles(resolved, limits);
  return {
    resolved,
    targetDir: path.resolve(/* turbopackIgnore: true */ process.cwd(), resolved.targetDir),
    files: files.map((file) => ({
      relativePath: file.relativePath,
      size: file.contents.byteLength,
    })),
    fileCount: files.length,
    totalBytes,
  };
}

interface WriteTargetOptions {
  overwrite: boolean;
}

async function assertWritableTarget(
  targetRoot: string,
  options: WriteTargetOptions,
): Promise<void> {
  if (!(await pathExists(targetRoot))) return;
  const stats = await lstat(targetRoot);
  if (!stats.isDirectory()) {
    throw new TargetDirectoryError(
      'TARGET_NOT_DIRECTORY',
      `Destination "${targetRoot}" exists and is not a directory.`,
      { targetDir: targetRoot },
    );
  }
  if (options.overwrite) return;
  const entries = await readdir(targetRoot);
  if (entries.length > 0) {
    throw new TargetDirectoryError(
      'TARGET_NOT_EMPTY',
      `Destination "${targetRoot}" is not empty. Enable overwrite to write into it.`,
      { targetDir: targetRoot, entries: entries.slice(0, 10) },
    );
  }
}

async function writeFiles(root: string, files: PlannedFile[], overwrite: boolean): Promise<void> {
  for (const file of files) {
    const destination = resolveInside(root, file.relativePath);
    await mkdir(path.dirname(destination), { recursive: true });
    try {
      await writeFile(destination, file.contents, { flag: overwrite ? 'w' : 'wx' });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
        throw new FileConflictError(
          `File "${file.relativePath}" already exists in the destination. Enable overwrite to replace it.`,
          { relativePath: file.relativePath, targetDir: root },
        );
      }
      throw error;
    }
  }
}

/**
 * Writes planned files to the destination.
 *
 * When the destination does not exist yet the files are written to a sibling
 * temporary directory that is then renamed into place, so a crash or a full
 * disk cannot leave a partially generated project.
 */
export async function writeProject(
  planned: PlannedFile[],
  targetRoot: string,
  options: WriteTargetOptions,
): Promise<void> {
  await assertWritableTarget(targetRoot, options);

  if (await pathExists(targetRoot)) {
    await writeFiles(targetRoot, planned, options.overwrite);
    return;
  }

  const tempRoot = `${targetRoot}.forgekit-tmp-${process.pid.toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  try {
    await mkdir(tempRoot, { recursive: true });
    await writeFiles(tempRoot, planned, true);
    await rename(tempRoot, targetRoot);
  } catch (error) {
    await rm(tempRoot, { recursive: true, force: true }).catch(() => undefined);
    throw toForgeKitError(error, `Failed to write project to "${targetRoot}"`);
  }
}

export interface GenerateOptions extends PlanOptions {
  /** Base directory that relative `targetDir` values resolve against. Defaults to `process.cwd()`. */
  cwd?: string;
}

/**
 * Generates a project from validated options.
 *
 * Set `dryRun` to validate and plan without writing anything.
 */
export async function generateProject(
  input: unknown,
  options: GenerateOptions = {},
): Promise<GenerateResult> {
  const startedAt = Date.now();
  const limits = options.limits ?? DEFAULT_LIMITS;
  const resolved = validateProjectOptions(input);
  const cwd = options.cwd ?? process.cwd();
  const targetRoot = path.resolve(cwd, resolved.targetDir);

  const { files, totalBytes } = await planFiles(resolved, limits);
  await assertWritableTarget(targetRoot, { overwrite: resolved.overwrite });

  if (!resolved.dryRun) {
    await writeProject(files, targetRoot, { overwrite: resolved.overwrite });
  }

  return {
    template: resolved.template,
    projectName: resolved.name,
    packageName: resolved.packageName,
    targetDir: resolved.targetDir,
    dryRun: resolved.dryRun,
    files: files.map((file) => file.relativePath).sort(),
    fileCount: files.length,
    bytesWritten: resolved.dryRun ? 0 : totalBytes,
    config: resolved.config,
    durationMs: Date.now() - startedAt,
  };
}
