import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { walkDirectory } from '../src/fs-utils.js';
import { DEFAULT_LIMITS } from '../src/types.js';

/** Creates an isolated temporary directory for a test. */
export async function makeTempDir(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'forgekit-test-'));
}

/** Removes a temporary directory created by `makeTempDir`. */
export async function removeTempDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

export async function pathExists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

export async function readText(file: string): Promise<string> {
  return readFile(file, 'utf8');
}

/** Generated files as sorted POSIX-relative paths. */
export async function listGeneratedFiles(root: string): Promise<string[]> {
  const files = await walkDirectory(root, DEFAULT_LIMITS);
  return files.map((file) => file.relativePath);
}

export function posixJoin(...segments: string[]): string {
  return path
    .join(...segments)
    .split(path.sep)
    .join('/');
}
