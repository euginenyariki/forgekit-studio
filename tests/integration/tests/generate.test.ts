import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { unzipSync, strFromU8 } from 'fflate';
import { afterAll, describe, expect, it } from 'vitest';

import {
  createArchiveBuffer,
  generateProject,
  getTemplateInfo,
  listTemplates,
  planFiles,
  planProject,
  validateProjectOptions,
} from '@forgekit/core';

declare const __FORGEKIT_INSTALL__: boolean;

const run = promisify(execFile);

/** Enabled by `pnpm test:templates` (Vitest `--mode install`) or `FORGEKIT_INSTALL=1`. */
const INSTALL = __FORGEKIT_INSTALL__ || process.env.FORGEKIT_INSTALL === '1';

const tempRoots: string[] = [];

async function makeWorkspace(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'forgekit-it-'));
  tempRoots.push(dir);
  return dir;
}

afterAll(async () => {
  await Promise.all(tempRoots.map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('generateProject', () => {
  it('generates every template into a fresh directory', async () => {
    const workspace = await makeWorkspace();
    const templates = await listTemplates();

    for (const template of templates) {
      const targetDir = path.join(workspace, template.id);
      const result = await generateProject({
        name: `it-${template.id}`,
        template: template.id,
        targetDir,
      });

      expect(result.fileCount).toBe(template.fileCount);
      expect(result.files).toEqual(template.files);
      expect(result.bytesWritten).toBeGreaterThan(0);

      for (const file of template.files) {
        const contents = await readFile(path.join(targetDir, file), 'utf8');
        expect(contents.length).toBeGreaterThan(0);
      }

      const pkg = JSON.parse(await readFile(path.join(targetDir, 'package.json'), 'utf8')) as {
        name: string;
      };
      expect(pkg.name).toBe(`it-${template.id}`);
    }
  });

  it('applies provided configuration to generated files', async () => {
    const workspace = await makeWorkspace();
    const targetDir = path.join(workspace, 'configured');
    await generateProject({
      name: 'configured',
      template: 'react-vite',
      targetDir,
      config: { port: 3456, packageManager: 'pnpm' },
    });

    const viteConfig = await readFile(path.join(targetDir, 'vite.config.ts'), 'utf8');
    expect(viteConfig).toContain('3456');

    const pkg = JSON.parse(await readFile(path.join(targetDir, 'package.json'), 'utf8')) as {
      packageManager?: string;
    };
    // package manager is rendered into install/run hints, not package.json,
    // so assert the README carries the chosen manager instead.
    const readme = await readFile(path.join(targetDir, 'README.md'), 'utf8');
    expect(readme + JSON.stringify(pkg)).toContain('pnpm');
  });

  it('refuses to write into a non-empty directory without overwrite', async () => {
    const workspace = await makeWorkspace();
    const targetDir = path.join(workspace, 'occupied');
    await mkdir(targetDir, { recursive: true });
    await writeFile(path.join(targetDir, 'keep.txt'), 'existing');

    await expect(
      generateProject({ name: 'occupied', template: 'express-api', targetDir }),
    ).rejects.toMatchObject({ code: 'TARGET_NOT_EMPTY' });
  });

  it('overwrites when asked', async () => {
    const workspace = await makeWorkspace();
    const targetDir = path.join(workspace, 'overwrite');
    await mkdir(targetDir, { recursive: true });
    await writeFile(path.join(targetDir, 'keep.txt'), 'existing');

    const result = await generateProject({
      name: 'overwrite',
      template: 'express-api',
      targetDir,
      overwrite: true,
    });
    expect(result.fileCount).toBeGreaterThan(0);
    // The pre-existing file survives; only conflicts are replaced.
    expect(await readFile(path.join(targetDir, 'keep.txt'), 'utf8')).toBe('existing');
  });
});

describe('planProject', () => {
  it('plans without touching the filesystem', async () => {
    const workspace = await makeWorkspace();
    const targetDir = path.join(workspace, 'planned');
    const plan = await planProject({ name: 'planned', template: 'fullstack', targetDir });

    expect(plan.fileCount).toBeGreaterThan(0);
    expect(path.isAbsolute(plan.targetDir)).toBe(true);
    await expect(readFile(path.join(targetDir, 'package.json'))).rejects.toThrow();
  });
});

describe('createArchiveBuffer', () => {
  it('round-trips every planned file through a zip', async () => {
    const info = await getTemplateInfo('react-vite');
    const resolved = validateProjectOptions({
      name: 'archived',
      template: 'react-vite',
      config: { port: 6200 },
    });

    const plan = await planProject({
      name: 'archived',
      template: 'react-vite',
      config: { port: 6200 },
    });
    expect(plan.fileCount).toBe(info.fileCount);

    const { files } = await planFiles(resolved);
    const archive = createArchiveBuffer('archived', files);

    const entries = unzipSync(new Uint8Array(archive));
    const names = Object.keys(entries).sort();
    const expected = info.files.map((file) => `archived/${file}`).sort();
    expect(names).toEqual(expected);

    const viteConfig = strFromU8(entries['archived/vite.config.ts']);
    expect(viteConfig).toContain('6200');
  });
});

describe.runIf(INSTALL)('generated projects install and typecheck', () => {
  it('installs and typechecks react-vite', async () => {
    const workspace = await makeWorkspace();
    const targetDir = path.join(workspace, 'install-react-vite');
    const result = await generateProject({
      name: 'install-react-vite',
      template: 'react-vite',
      targetDir,
      config: { packageManager: 'npm' },
    });

    expect(result.fileCount).toBeGreaterThan(0);
    await run('npm', ['install', '--no-audit', '--no-fund'], { cwd: targetDir });
    await run('npm', ['run', 'typecheck'], { cwd: targetDir });
  }, 300_000);
});
