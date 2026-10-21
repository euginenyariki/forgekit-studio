import { describe, expect, it } from 'vitest';

import { TemplateRenderError } from '../src/errors.js';
import { findPlaceholders, renderTemplate } from '../src/render.js';

describe('renderTemplate', () => {
  it('replaces documented placeholders', () => {
    expect(
      renderTemplate(
        'name: {{projectName}} port {{port}}',
        { projectName: 'demo', port: 4000 },
        'a.ts',
      ),
    ).toBe('name: demo port 4000');
  });

  it('allows whitespace inside the braces', () => {
    expect(renderTemplate('{{  packageName  }}', { packageName: 'demo' }, 'a.json')).toBe('demo');
  });

  it('replaces repeated placeholders', () => {
    expect(renderTemplate('{{port}}-{{port}}', { port: 1 }, 'a.ts')).toBe('1-1');
  });

  it('leaves JSX object literals untouched', () => {
    const source = '<div style={{ marginTop: 8 }}>{{projectName}}</div>';
    expect(renderTemplate(source, { projectName: 'demo' }, 'App.tsx')).toBe(
      '<div style={{ marginTop: 8 }}>demo</div>',
    );
  });

  it('throws for unknown variables', () => {
    expect(() => renderTemplate('{{notAVariable}}', { projectName: 'demo' }, 'a.ts')).toThrowError(
      /Unknown template variable/,
    );
  });

  it('throws when a value is missing for the template', () => {
    expect(() => renderTemplate('{{apiPort}}', { projectName: 'demo' }, 'a.ts')).toThrowError(
      /is not available for this template/,
    );
  });

  it('throws when a replacement value contains an opening brace pair', () => {
    expect(() => renderTemplate('{{description}}', { description: '{{x}}' }, 'a.ts')).toThrowError(
      /must not contain/,
    );
  });

  it('exposes TemplateRenderError instances with structured details', () => {
    try {
      renderTemplate('{{nope}}', {}, 'templates/x/file.ts');
      throw new Error('expected renderTemplate to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(TemplateRenderError);
      const renderError = error as TemplateRenderError;
      expect(renderError.code).toBe('TEMPLATE_RENDER_ERROR');
      expect(renderError.details).toMatchObject({ file: 'templates/x/file.ts', variable: 'nope' });
    }
  });
});

describe('findPlaceholders', () => {
  it('lists unique placeholders in order of appearance', () => {
    expect(findPlaceholders('{{b}} {{a}} {{b}}')).toEqual(['b', 'a']);
  });

  it('returns an empty list when there is nothing to replace', () => {
    expect(findPlaceholders('const x = { a: 1 };')).toEqual([]);
  });
});
