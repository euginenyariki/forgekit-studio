import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { TEMPLATE_IDS, isTemplateId } from './ids.js';

export * from './ids.js';
export * from './types.js';

const TEMPLATE_DIR_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

/** True when `dir` looks like a ForgeKit templates directory. */
function isTemplatesDir(dir: string): boolean {
  return existsSync(path.join(dir, 'react-vite', 'template.json'));
}

/**
 * Locates the templates directory from this module's own URL.
 *
 * Only string file URLs are used, so the lookup stays safe when a bundler
 * (Next.js/Turbopack/Webpack) rewrites `import.meta` — in that case the URL no
 * longer points at the package and this returns `null`.
 */
function templatesDirFromModule(): string | null {
  const url = import.meta.url;
  if (typeof url !== 'string' || !url.startsWith('file:')) return null;
  try {
    const candidate = path.resolve(path.dirname(fileURLToPath(url)), '..', 'templates');
    return isTemplatesDir(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

/**
 * Walks up from the working directory looking for an installed or workspace
 * `@forgekit/templates/templates` directory. Used when the module was bundled.
 */
function templatesDirFromCwd(): string | null {
  let dir = path.resolve(/* turbopackIgnore: true */ process.cwd());
  for (;;) {
    const candidates = [
      path.join(dir, 'templates'),
      path.join(dir, 'packages', 'templates', 'templates'),
      path.join(dir, 'node_modules', '@forgekit', 'templates', 'templates'),
    ];
    for (const candidate of candidates) {
      if (isTemplatesDir(candidate)) return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

let cachedTemplatesRoot: string | null = null;

/** All template identifiers, in catalog order. */
export function listTemplateIds(): readonly (typeof TEMPLATE_IDS)[number][] {
  return TEMPLATE_IDS;
}

/** Absolute path of the directory that contains every template project. */
export function getTemplatesRoot(): string {
  if (cachedTemplatesRoot === null) {
    const resolved = templatesDirFromModule() ?? templatesDirFromCwd();
    if (!resolved) {
      throw new Error(
        'Unable to locate the ForgeKit templates directory. Ensure @forgekit/templates is installed.',
      );
    }
    cachedTemplatesRoot = resolved;
  }
  return cachedTemplatesRoot;
}

/**
 * Absolute path of a single template directory.
 *
 * The id is checked against an allowlist and the resolved path is verified to
 * stay inside the templates root, so no traversal is possible.
 */
export function getTemplateDir(id: string): string {
  if (!isTemplateId(id)) {
    throw new Error(
      `Template "${String(id)}" does not exist. Expected one of: ${TEMPLATE_IDS.join(', ')}.`,
    );
  }
  const root = getTemplatesRoot();
  const dir = path.resolve(root, id);
  const relative = path.relative(root, dir);
  if (
    relative === '' ||
    relative.startsWith(`..${path.sep}`) ||
    relative === '..' ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`Template path for "${id}" escapes the templates root.`);
  }
  return dir;
}

/** Absolute path of a template's `content/` directory (the files that get copied). */
export function getTemplateContentDir(id: string): string {
  return path.join(getTemplateDir(id), 'content');
}

/**
 * Reads and parses `template.json` for a template.
 *
 * The returned value is unvalidated `unknown`; `@forgekit/core` parses it with
 * Zod and reports structured manifest errors.
 */
export async function readTemplateJson(id: string): Promise<unknown> {
  const manifestPath = path.join(getTemplateDir(id), 'template.json');
  const raw = await readFile(manifestPath, 'utf8');
  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Template manifest is not valid JSON (${manifestPath}): ${reason}`, {
      cause: error,
    });
  }
}

/** Reads the raw text of `template.json` without parsing it. */
export async function readTemplateJsonRaw(id: string): Promise<string> {
  return readFile(path.join(getTemplateDir(id), 'template.json'), 'utf8');
}

/**
 * Reads every `template.json` keyed by template id.
 *
 * Discovery is directory based, so a new template directory is picked up
 * automatically; ids are still validated against the exported allowlist.
 */
export async function readAllTemplateJson(): Promise<Map<string, unknown>> {
  const root = getTemplatesRoot();
  const manifests = new Map<string, unknown>();
  const entries = await readdir(/* turbopackIgnore: true */ root, {
    withFileTypes: true,
  }).catch((error: unknown) => {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to read templates root at ${root}: ${reason}`);
  });
  for (const entry of entries) {
    if (!entry.isDirectory() || !TEMPLATE_DIR_PATTERN.test(entry.name)) continue;
    if (!isTemplateId(entry.name)) continue;
    manifests.set(entry.name, await readTemplateJson(entry.name));
  }
  return manifests;
}
