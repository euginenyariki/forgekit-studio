import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { generateProject, planProject } from '../src/generator.js';
import { makeTempDir, pathExists, readText, removeTempDir } from './helpers.js';

let tempDir = '';

beforeEach(async () => {
  tempDir = await makeTempDir();
});

afterEach(async () => {
  await removeTempDir(tempDir);
});

describe('generateProject', () => {
  it('writes a rendered project and leaves no temporary directories behind', async () => {
    const result = await generateProject(
      { name: 'demo-app', template: 'react-vite' },
      { cwd: tempDir },
    );

    expect(result).toMatchObject({
      template: 'react-vite',
      projectName: 'demo-app',
      packageName: 'demo-app',
      targetDir: 'demo-app',
      dryRun: false,
    });
    expect(result.fileCount).toBeGreaterThan(0);
    expect(result.bytesWritten).toBeGreaterThan(0);
    expect(result.files).toEqual([...result.files].sort());
    expect(typeof result.durationMs).toBe('number');

    expect(await readdir(tempDir)).toEqual(['demo-app']);

    const packageJson = JSON.parse(
      await readText(path.join(tempDir, 'demo-app', 'package.json')),
    ) as { name: string; description: string };
    expect(packageJson.name).toBe('demo-app');
    expect(packageJson.description).toBe('A React app generated with ForgeKit.');

    expect(await readText(path.join(tempDir, 'demo-app', '.gitignore'))).toContain('node_modules');
  });

  it('writes nothing for a dry run', async () => {
    const result = await generateProject(
      { name: 'ghost', template: 'react-vite', dryRun: true },
      { cwd: tempDir },
    );

    expect(result.dryRun).toBe(true);
    expect(result.bytesWritten).toBe(0);
    expect(result.fileCount).toBeGreaterThan(0);
    expect(await pathExists(path.join(tempDir, 'ghost'))).toBe(false);
    expect(await readdir(tempDir)).toEqual([]);
  });

  it('creates nested target directories', async () => {
    await generateProject(
      { name: 'nested-app', template: 'express-api', targetDir: 'projects/nested-app' },
      { cwd: tempDir },
    );

    expect(await pathExists(path.join(tempDir, 'projects', 'nested-app', 'package.json'))).toBe(
      true,
    );
    expect(await readdir(tempDir)).toEqual(['projects']);
  });

  it('refuses to write into a non-empty directory without overwrite', async () => {
    const input = { name: 'busy', template: 'react-vite' } as const;
    await generateProject(input, { cwd: tempDir });

    await expect(generateProject(input, { cwd: tempDir })).rejects.toMatchObject({
      code: 'TARGET_NOT_EMPTY',
    });
  });

  it('overwrites existing files when overwrite is enabled', async () => {
    const input = { name: 'busy', template: 'express-api', overwrite: true } as const;
    const first = await generateProject(input, { cwd: tempDir });
    const second = await generateProject(input, { cwd: tempDir });

    expect(second.bytesWritten).toBe(first.bytesWritten);
    expect(second.files).toEqual(first.files);
  });

  it('refuses when the destination exists and is a file', async () => {
    await writeFile(path.join(tempDir, 'taken.ts'), 'not a directory');

    await expect(
      generateProject(
        { name: 'file-target', template: 'react-vite', targetDir: 'taken.ts' },
        { cwd: tempDir },
      ),
    ).rejects.toMatchObject({ code: 'TARGET_NOT_DIRECTORY' });
  });

  it('reports unknown templates instead of writing', async () => {
    await expect(
      generateProject({ name: 'nope', template: 'unknown-template' }, { cwd: tempDir }),
    ).rejects.toMatchObject({ code: 'TEMPLATE_NOT_FOUND' });
    expect(await readdir(tempDir)).toEqual([]);
  });

  it('generates the fullstack template with both workspaces', async () => {
    const result = await generateProject(
      {
        name: 'stack-demo',
        template: 'fullstack',
        config: { webPort: 3010, apiPort: 4020, packageManager: 'pnpm' },
      },
      { cwd: tempDir },
    );

    expect(result.files).toContain('apps/web/src/App.tsx');
    expect(result.files).toContain('apps/api/src/server.ts');
    expect(result.files).toContain('apps/web/.gitignore');

    const rootPackage = await readText(path.join(tempDir, 'stack-demo', 'package.json'));
    expect(rootPackage).toContain('pnpm run dev');
    expect(
      await readText(path.join(tempDir, 'stack-demo', 'apps', 'api', '.env.example')),
    ).toContain('PORT=4020');
  });

  it('plans the same files it writes', async () => {
    const input = { name: 'consistent', template: 'fullstack' } as const;
    const plan = await planProject(input);
    const result = await generateProject(input, { cwd: tempDir });

    expect(result.files).toEqual(plan.files.map((file) => file.relativePath));
    expect(result.bytesWritten).toBe(plan.totalBytes);
  });
});
