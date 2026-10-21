import { TEMPLATE_IDS } from '@forgekit/templates/ids';
import { describe, expect, it } from 'vitest';

import { TemplateNotFoundError } from '../src/errors.js';
import { getTemplateInfo, listTemplates, parseManifest } from '../src/registry.js';
import { readTemplateJson } from '@forgekit/templates';
import { renameTemplatePath } from '../src/template-paths.js';

describe('listTemplates', () => {
  it('returns every shipped template in the documented order', async () => {
    const templates = await listTemplates();
    expect(templates.map((template) => template.id)).toEqual([...TEMPLATE_IDS]);
  });

  it('describes templates with renderable commands and a file list', async () => {
    for (const template of await listTemplates()) {
      expect(template.fileCount).toBeGreaterThan(0);
      expect(template.files).toHaveLength(template.fileCount);
      expect(template.totalBytes).toBeGreaterThan(0);
      expect(template.configFields.length).toBeGreaterThan(0);

      for (const command of Object.values(template.commands)) {
        expect(command).not.toContain('{{');
      }
      for (const file of template.files) {
        expect(file).not.toMatch(/^\.{0,2}\//);
        expect(file.startsWith('/')).toBe(false);
      }
      expect([...template.files].sort()).toEqual(template.files);
    }
  });

  it('lists the same paths the generator writes', async () => {
    for (const template of await listTemplates()) {
      expect(template.files).toEqual(template.files.map((file) => renameTemplatePath(file)));
    }
  });

  it('applies the dotfile convention in the catalog', async () => {
    const reactVite = await getTemplateInfo('react-vite');
    expect(reactVite.files).toContain('.gitignore');
    expect(reactVite.files).not.toContain('gitignore');
  });

  it('reports concrete details for the fullstack template', async () => {
    const fullstack = await getTemplateInfo('fullstack');
    expect(fullstack.category).toBe('fullstack');
    expect(fullstack.commands.dev).toBe('npm run dev');
    expect(fullstack.defaults).toMatchObject({ webPort: 5173, apiPort: 4000 });
    expect(fullstack.files).toContain('apps/web/vite.config.ts');
    expect(fullstack.files).toContain('apps/api/src/server.ts');
  });

  it('rejects unknown templates', async () => {
    await expect(getTemplateInfo('unknown-template')).rejects.toBeInstanceOf(TemplateNotFoundError);
  });

  it('rejects manifests whose id does not match the directory', () => {
    expect(() => parseManifest('fullstack', { id: 'react-vite' })).toThrowError(
      /does not match its directory/,
    );
  });

  it('rejects malformed manifests with a structured error', async () => {
    const raw = await readTemplateJson('react-vite');
    expect(() =>
      parseManifest('react-vite', { ...(raw as object), templateVersion: 'v1' }),
    ).toThrowError(/templateVersion must be semver/);
  });
});
