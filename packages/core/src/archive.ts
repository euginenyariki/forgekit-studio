import { zipSync } from 'fflate';

import { ArchiveError } from './errors.js';
import type { PlannedFile } from './types.js';

/**
 * Builds a zip archive containing the planned files under a single `<name>/` folder.
 *
 * Entry order follows `files`, which the generator already sorted, and no
 * timestamps are read from disk, so archives generated from the same plan have
 * identical entry order and contents.
 *
 * @throws ArchiveError when an entry path is unsafe or the archive cannot be built.
 */
export function createArchive(projectName: string, files: PlannedFile[]): Uint8Array {
  if (projectName.length === 0) {
    throw new ArchiveError('Archive project name must not be empty');
  }
  if (files.length === 0) {
    throw new ArchiveError('Cannot create an archive without files');
  }

  const prefix = projectName.endsWith('/') ? projectName : `${projectName}/`;
  const entries: Record<string, [Uint8Array, { level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 }]> =
    {};

  for (const file of files) {
    if (file.relativePath.startsWith('/') || file.relativePath.includes('..')) {
      throw new ArchiveError(`Refusing to archive unsafe path "${file.relativePath}"`, {
        relativePath: file.relativePath,
      });
    }
    entries[`${prefix}${file.relativePath}`] = [file.contents, { level: 6 }];
  }

  try {
    return zipSync(entries);
  } catch (error) {
    throw new ArchiveError(
      `Failed to build archive for "${projectName}": ${
        error instanceof Error ? error.message : String(error)
      }`,
      { projectName },
    );
  }
}

/** Convenience wrapper returning a Node `Buffer`. */
export function createArchiveBuffer(projectName: string, files: PlannedFile[]): Buffer {
  return Buffer.from(createArchive(projectName, files));
}
