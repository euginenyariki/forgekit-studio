import { describe, expect, it } from 'vitest';

import { getTemplateInfo } from '@forgekit/core';

import { buildProjectRequest, coerceConfigValues, formToRawProject } from '@/lib/project-request';

describe('coerceConfigValues', () => {
  const fields = [
    { key: 'port', label: 'Port', type: 'number' as const, help: '', required: true },
    {
      key: 'packageManager',
      label: 'Package manager',
      type: 'select' as const,
      help: '',
      required: true,
      options: [
        { value: 'npm', label: 'npm' },
        { value: 'pnpm', label: 'pnpm' },
      ],
    },
    { key: 'description', label: 'Description', type: 'string' as const, help: '', required: true },
  ];

  it('parses numeric strings and keeps text', () => {
    const config = coerceConfigValues(fields, {
      port: '4100',
      packageManager: 'pnpm',
      description: 'Hello',
    });
    expect(config).toEqual({ port: 4100, packageManager: 'pnpm', description: 'Hello' });
  });

  it('drops empty values so template defaults apply', () => {
    const config = coerceConfigValues(fields, { port: '', description: '   ' });
    expect(config).toEqual({});
  });

  it('ignores keys that are not template fields', () => {
    const config = coerceConfigValues(fields, { nope: 'x' });
    expect(config).toEqual({});
  });
});

describe('formToRawProject', () => {
  it('collects config.* fields and top level values', () => {
    const form = new FormData();
    form.set('name', 'storefront');
    form.set('template', 'fullstack');
    form.set('config.webPort', '3000');
    form.set('config.packageManager', 'yarn');
    form.set('unrelated', 'ignored');

    const raw = formToRawProject(form);
    expect(raw).toEqual({
      name: 'storefront',
      template: 'fullstack',
      targetDir: null,
      overwrite: null,
      config: { webPort: '3000', packageManager: 'yarn' },
    });
  });
});

describe('buildProjectRequest', () => {
  it('normalizes a valid request and coerces numbers', async () => {
    const request = await buildProjectRequest({
      name: '  My App  ',
      template: 'react-vite',
      config: { port: '5000' },
    });
    expect(request.name).toBe('My App');
    expect(request.template).toBe('react-vite');
    expect(request.config).toMatchObject({ port: 5000 });
  });

  it('rejects unknown templates', async () => {
    await expect(buildProjectRequest({ name: 'x', template: 'nope' })).rejects.toThrow();
  });

  it('includes overwrite and targetDir only when provided', async () => {
    const request = await buildProjectRequest({
      name: 'app',
      template: 'express-api',
      overwrite: 'true',
      targetDir: 'projects/app',
    });
    expect(request.overwrite).toBe(true);
    expect(request.targetDir).toBe('projects/app');
  });

  it('stays in sync with the template field definitions', async () => {
    const info = await getTemplateInfo('react-vite');
    const request = await buildProjectRequest({
      name: 'app',
      template: 'react-vite',
      config: { bogus: 'ignored' },
    });
    const config = request.config as Record<string, unknown>;
    expect(Object.keys(config)).toEqual([]);
    expect(info.configFields.map((field) => field.key)).toContain('port');
  });
});
