import { TEMPLATE_IDS, isTemplateId } from '@forgekit/templates/ids';
import { readAllTemplateJson, readTemplateJson } from '@forgekit/templates';
import { describe, expect, it } from 'vitest';

import { TemplateManifestError } from '../src/errors.js';
import { findPlaceholders, isTemplateVariable, renderTemplate } from '../src/render.js';
import { manifestSchema, parseManifest } from '../src/registry.js';
import { buildTemplateVariables, defaultConfigs } from '../src/template-config.js';

const EXPECTED_CATEGORIES: Record<string, string> = {
  'react-vite': 'frontend',
  'express-api': 'backend',
  fullstack: 'fullstack',
};

describe('template manifests', () => {
  it('ships exactly the templates listed by @forgekit/templates', async () => {
    const manifests = await readAllTemplateJson();
    expect([...manifests.keys()].sort()).toEqual([...TEMPLATE_IDS].sort());
  });

  it.each([...TEMPLATE_IDS])('parses the %s manifest without errors', async (templateId) => {
    const manifest = parseManifest(templateId, await readTemplateJson(templateId));

    expect(manifest.id).toBe(templateId);
    expect(manifest.templateVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(manifest.category).toBe(EXPECTED_CATEGORIES[templateId]);
    expect(manifest.tags.length).toBeGreaterThan(0);
    expect(manifest.technologies.length).toBeGreaterThan(0);
    expect(manifest.setupRequirements.length).toBeGreaterThan(0);
    expect(manifest.summary.length).toBeLessThanOrEqual(200);
  });

  it.each([...TEMPLATE_IDS])(
    'renders the %s commands with the template defaults',
    async (templateId) => {
      const manifest = parseManifest(templateId, await readTemplateJson(templateId));
      const variables = buildTemplateVariables(
        'sample-project',
        'sample-project',
        defaultConfigs[templateId],
      );

      for (const command of Object.values(manifest.commands)) {
        const rendered = renderTemplate(command, variables, `${templateId}/template.json`);
        expect(rendered).not.toContain('{{');
        expect(rendered).toMatch(/^(npm|pnpm|yarn) run /);
      }
    },
  );

  it.each([...TEMPLATE_IDS])(
    'only uses documented variables in the %s commands',
    async (templateId) => {
      const manifest = parseManifest(templateId, await readTemplateJson(templateId));
      for (const command of Object.values(manifest.commands)) {
        for (const placeholder of findPlaceholders(command)) {
          expect(isTemplateVariable(placeholder)).toBe(true);
        }
      }
    },
  );

  it('rejects a manifest whose id does not match its directory', () => {
    const payload = {
      id: 'not-react-vite',
      templateVersion: '1.0.0',
      name: 'Mismatched',
      summary: 'summary',
      description: 'description',
      category: 'frontend',
      tags: ['x'],
      technologies: ['x'],
      setupRequirements: ['x'],
      commands: { dev: 'npm run dev', build: 'npm run build', typecheck: 'npm run typecheck' },
    };

    expect(() => parseManifest('react-vite', payload)).toThrowError(TemplateManifestError);
  });

  it('rejects malformed manifests with a structured error', () => {
    const result = manifestSchema.safeParse({ id: 'x', templateVersion: 'v1' });
    expect(result.success).toBe(false);

    expect(() => parseManifest('react-vite', { id: 'react-vite' })).toThrowError(
      TemplateManifestError,
    );
  });

  it('exposes a type guard for template ids', () => {
    expect(isTemplateId('fullstack')).toBe(true);
    expect(isTemplateId('not-a-template')).toBe(false);
    expect(isTemplateId(7)).toBe(false);
  });

  it('keeps every documented template variable renderable', () => {
    expect(isTemplateVariable('projectName')).toBe(true);
    expect(isTemplateVariable('apiPort')).toBe(true);
    expect(isTemplateVariable('nope')).toBe(false);
    expect(findPlaceholders('{{packageManager}} run build')).toEqual(['packageManager']);
  });
});
