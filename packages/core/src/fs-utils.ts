import { lstat, readdir } from 'node:fs/promises';
import path from 'node:path';

import { LimitExceededError, UnsafePathError } from './errors.js';
import { DEFAULT_LIMITS, type GenerationLimits } from './types.js';

/** Windows reserved characters that are unsafe in file names everywhere. */
const RESERVED_CHARS = /[<>:"|?*]/;
const TRAILING_UNSAFE = /[ .]$/;

/** True when the value contains C0 control characters or DEL. */
function hasControlChars(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 32 || code === 127) return true;
  }
  return false;
}

/**
 * Validates a template-relative path.
 *
 * Rejects traversal, absolute paths, control characters (including null
 * bytes), Windows reserved characters and segments that end with a space or
 * dot (which Windows would silently strip).
 *
 * @throws UnsafePathError describing the offending segment.
 */
export function assertSafeRelativePath(relativePath: string): void {
  if (relativePath.length === 0) {
    throw new UnsafePathError('Template path must not be empty');
  }
  if (hasControlChars(relativePath)) {
    throw new UnsafePathError('Template path must not contain control characters', {
      relativePath,
    });
  }
  if (
    path.isAbsolute(relativePath) ||
    relativePath.startsWith('/') ||
    /^[a-zA-Z]:[\\/]/.test(relativePath)
  ) {
    throw new UnsafePathError(`Template path must be relative: "${relativePath}"`, {
      relativePath,
    });
  }

  const segments = relativePath.split(/[\\/]/);
  for (const segment of segments) {
    if (segment === '' || segment === '.' || segment === '..') {
      throw new UnsafePathError(
        `Template path "${relativePath}" contains an unsafe segment "${segment}"`,
        { relativePath, segment },
      );
    }
    if (RESERVED_CHARS.test(segment)) {
      throw new UnsafePathError(
        `Template path "${relativePath}" contains a character that is not portable: "${segment}"`,
        { relativePath, segment },
      );
    }
    if (TRAILING_UNSAFE.test(segment)) {
      throw new UnsafePathError(
        `Template path "${relativePath}" has a segment ending with a space or dot: "${segment}"`,
        { relativePath, segment },
      );
    }
  }
}

/** Converts a native relative path to POSIX form after validating it. */
export function toPosixRelative(relativePath: string): string {
  assertSafeRelativePath(relativePath);
  return relativePath.split(path.sep).join('/');
}

/** Appends `relativePath` to `base` and verifies the result stays inside `base`. */
export function resolveInside(base: string, relativePath: string): string {
  assertSafeRelativePath(relativePath);
  const resolved = path.resolve(base, relativePath);
  const rel = path.relative(base, resolved);
  if (rel === '' || rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new UnsafePathError(`Resolved path escapes the destination: "${relativePath}"`, {
      relativePath,
      resolved,
    });
  }
  return resolved;
}

export interface WalkedFile {
  /** POSIX-style path relative to the walk root. */
  relativePath: string;
  absolutePath: string;
  size: number;
}

/**
 * Recursively collects every regular file below `root`.
 *
 * Symlinks are rejected outright: templates must be plain files so a generated
 * project can never contain a link pointing outside the destination.
 *
 * @throws UnsafePathError for symlinks or unsafe names.
 * @throws LimitExceededError when a configured limit would be passed.
 */
export async function walkDirectory(
  root: string,
  limits: GenerationLimits = DEFAULT_LIMITS,
): Promise<WalkedFile[]> {
  const files: WalkedFile[] = [];
  let totalBytes = 0;

  async function visit(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(dir, entry.name);
      const relativePath = path.relative(root, absolutePath);

      if (entry.isSymbolicLink()) {
        throw new UnsafePathError(
          `Template contains a symbolic link, which is not allowed: "${toPosixRelative(relativePath)}"`,
          { relativePath: toPosixRelative(relativePath) },
        );
      }

      if (entry.isDirectory()) {
        await visit(absolutePath);
        continue;
      }
      if (!entry.isFile()) {
        throw new UnsafePathError(
          `Template contains a non-regular file: "${toPosixRelative(relativePath)}"`,
          { relativePath: toPosixRelative(relativePath) },
        );
      }

      const posixPath = toPosixRelative(relativePath);
      const stats = await lstat(absolutePath);

      if (stats.size > limits.maxFileBytes) {
        throw new LimitExceededError(
          `Template file "${posixPath}" is ${stats.size} bytes, over the ${limits.maxFileBytes} byte per-file limit.`,
          { relativePath: posixPath, size: stats.size, limit: limits.maxFileBytes },
        );
      }
      if (files.length + 1 > limits.maxFiles) {
        throw new LimitExceededError(`Template contains more than ${limits.maxFiles} files.`, {
          limit: limits.maxFiles,
        });
      }
      totalBytes += stats.size;
      if (totalBytes > limits.maxTotalBytes) {
        throw new LimitExceededError(
          `Template exceeds the total size limit of ${limits.maxTotalBytes} bytes.`,
          { limit: limits.maxTotalBytes, totalBytes },
        );
      }

      files.push({ relativePath: posixPath, absolutePath, size: stats.size });
    }
  }

  await visit(root);
  files.sort((a, b) =>
    a.relativePath < b.relativePath ? -1 : a.relativePath > b.relativePath ? 1 : 0,
  );
  return files;
}
