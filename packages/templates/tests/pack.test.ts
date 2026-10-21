import { execFile } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

import { TEMPLATE_IDS } from '../src/ids.js';

const run = promisify(execFile);
const packageRoot = fileURLToPath(new URL('..', import.meta.url));

interface PackFile {
  path: string;
  size: number;
}

interface PackResult {
  files: PackFile[];
}

async function listFilesRecursive(root: string, prefix = ''): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(path.join(root, entry.name), relativePath)));
    } else {
      files.push(relativePath);
    }
  }
  return files.sort();
}

/**
 * `npm pack` decides what reaches consumers. Some dotfiles are stripped from
 * published tarballs, which is why templates store them under safe names; this
 * test proves the convention keeps every template file in the tarball.
 */
describe('published tarball contents', () => {
  it('includes the entry points, LICENSE and every template file', async () => {
    const { stdout } = await run('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
      cwd: packageRoot,
      maxBuffer: 10 * 1024 * 1024,
    });

    const parsed = JSON.parse(stdout) as PackResult[] | Record<string, PackResult>;
    const results = Array.isArray(parsed) ? parsed : Object.values(parsed);
    const [result] = results;
    expect(result, 'npm pack produced no result').toBeDefined();

    const paths = new Set(result!.files.map((file) => file.path));

    for (const required of ['LICENSE', 'README.md', 'dist/index.js', 'dist/ids.js']) {
      expect(paths, `missing ${required}`).toContain(required);
    }

    for (const id of TEMPLATE_IDS) {
      expect(paths, `missing templates/${id}/template.json`).toContain(
        `templates/${id}/template.json`,
      );
      const contentFiles = await listFilesRecursive(
        path.join(packageRoot, 'templates', id, 'content'),
      );
      expect(contentFiles.length).toBeGreaterThan(0);
      for (const file of contentFiles) {
        expect(paths, `missing templates/${id}/content/${file}`).toContain(
          `templates/${id}/content/${file}`,
        );
      }
    }
  });
});
