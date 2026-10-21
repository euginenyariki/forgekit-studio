import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  TEMPLATE_IDS,
  getTemplateContentDir,
  getTemplateDir,
  isTemplateId,
  listTemplateIds,
  readAllTemplateJson,
  readTemplateJson,
  readTemplateJsonRaw,
} from '../src/index.js';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const templatesRoot = path.join(packageRoot, 'templates');

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

describe('shipped templates', () => {
  it('exposes a stable, sorted id list', () => {
    expect([...TEMPLATE_IDS]).toEqual(['react-vite', 'express-api', 'fullstack']);
    expect(listTemplateIds()).toEqual([...TEMPLATE_IDS]);
    expect(isTemplateId('react-vite')).toBe(true);
    expect(isTemplateId('react-vite-2')).toBe(false);
  });

  it('has one directory per id, each with a manifest and content', async () => {
    const entries = await readdir(templatesRoot, { withFileTypes: true });
    const directories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

    expect(directories.sort()).toEqual([...TEMPLATE_IDS].sort());

    for (const id of TEMPLATE_IDS) {
      expect((await stat(path.join(templatesRoot, id, 'template.json'))).isFile()).toBe(true);
      expect((await stat(path.join(templatesRoot, id, 'content'))).isDirectory()).toBe(true);
    }
  });

  it('stores dotfiles without the leading dot', async () => {
    for (const id of TEMPLATE_IDS) {
      const files = await listFilesRecursive(getTemplateContentDir(id));
      expect(files.length).toBeGreaterThan(0);
      for (const file of files) {
        for (const segment of file.split('/')) {
          expect(segment.startsWith('.')).toBe(false);
        }
      }
    }
  });

  it('lists the renamed dotfiles a project will receive', async () => {
    const reactVite = await listFilesRecursive(getTemplateContentDir('react-vite'));
    expect(reactVite).toContain('gitignore');
    expect(reactVite).not.toContain('.gitignore');
  });

  it('reads every manifest as JSON with a matching id', async () => {
    const manifests = await readAllTemplateJson();
    expect([...manifests.keys()].sort()).toEqual([...TEMPLATE_IDS].sort());

    for (const id of TEMPLATE_IDS) {
      const manifest = await readTemplateJson(id);
      expect(manifest).toMatchObject({ id });
      expect(typeof (manifest as { summary: unknown }).summary).toBe('string');

      const raw = await readTemplateJsonRaw(id);
      expect(JSON.parse(raw)).toEqual(manifest);
    }
  });

  it('resolves template locations inside the package', () => {
    for (const id of TEMPLATE_IDS) {
      const dir = getTemplateDir(id);
      expect(path.isAbsolute(dir)).toBe(true);
      expect(dir.startsWith(packageRoot)).toBe(true);
      expect(getTemplateContentDir(id)).toBe(path.join(dir, 'content'));
    }
  });

  it('rejects unknown ids and traversal', () => {
    expect(() => getTemplateDir('does-not-exist')).toThrowError(/does not exist|escapes/);
    expect(() => getTemplateDir('../etc')).toThrowError(/does not exist|escapes/);
  });

  it('does not depend on Node built-ins from the pure ids entry point', async () => {
    const source = await readFile(path.join(packageRoot, 'dist', 'ids.js'), 'utf8');
    expect(source).not.toContain('node:');
    expect(source).toContain('TEMPLATE_IDS');
  });
});
