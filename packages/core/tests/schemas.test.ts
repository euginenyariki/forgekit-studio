import { TEMPLATE_IDS } from '@forgekit/templates/ids';
import { describe, expect, it } from 'vitest';

import { TemplateNotFoundError, ValidationError } from '../src/errors.js';
import { toPackageName, validateProjectOptions } from '../src/schemas.js';

describe('validateProjectOptions', () => {
  it('applies defaults for the react-vite template', () => {
    const resolved = validateProjectOptions({ name: 'my-app', template: 'react-vite' });

    expect(resolved).toMatchObject({
      name: 'my-app',
      packageName: 'my-app',
      template: 'react-vite',
      targetDir: 'my-app',
      dryRun: false,
      overwrite: false,
      config: {
        description: 'A React app generated with ForgeKit.',
        port: 5173,
        packageManager: 'npm',
      },
    });
  });

  it('applies defaults for the express-api template', () => {
    const resolved = validateProjectOptions({ name: 'api', template: 'express-api' });

    expect(resolved.config).toEqual({
      description: 'An Express API generated with ForgeKit.',
      port: 4000,
      corsOrigin: 'http://localhost:5173',
      packageManager: 'npm',
    });
  });

  it('keeps provided configuration and honours targetDir, dryRun and overwrite', () => {
    const resolved = validateProjectOptions({
      name: 'demo',
      template: 'fullstack',
      targetDir: 'projects/demo',
      dryRun: true,
      overwrite: true,
      config: {
        description: 'A demo stack.',
        webPort: 3000,
        apiPort: 8080,
        packageManager: 'pnpm',
      },
    });

    expect(resolved.targetDir).toBe('projects/demo');
    expect(resolved.dryRun).toBe(true);
    expect(resolved.overwrite).toBe(true);
    expect(resolved.config).toEqual({
      description: 'A demo stack.',
      webPort: 3000,
      apiPort: 8080,
      packageManager: 'pnpm',
    });
  });

  it('derives a lowercase package name from the project name', () => {
    expect(validateProjectOptions({ name: 'My-App', template: 'react-vite' }).packageName).toBe(
      'my-app',
    );
  });

  it('rejects unknown top-level options', () => {
    const error = (() => {
      try {
        validateProjectOptions({ name: 'demo', template: 'react-vite', typo: true });
        return undefined;
      } catch (cause) {
        return cause;
      }
    })();

    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).issues).toEqual([expect.objectContaining({ path: 'typo' })]);
  });

  it('rejects unknown configuration keys', () => {
    try {
      validateProjectOptions({ name: 'demo', template: 'react-vite', config: { secret: 1 } });
      throw new Error('expected validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).issues[0]?.path).toBe('config.secret');
    }
  });

  it('rejects invalid configuration values', () => {
    try {
      validateProjectOptions({ name: 'demo', template: 'react-vite', config: { port: 0 } });
      throw new Error('expected validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).issues[0]).toMatchObject({ path: 'config.port' });
    }
  });

  it('rejects descriptions that would break JSON or HTML output', () => {
    for (const description of ['has "quotes"', 'a <tag>', 'back\\slash']) {
      expect(() =>
        validateProjectOptions({ name: 'demo', template: 'react-vite', config: { description } }),
      ).toThrowError(ValidationError);
    }
  });

  it('rejects unsafe project names', () => {
    for (const name of ['..', '../escape', 'ends-', 'dot.', 'has space', '{{x}}']) {
      expect(() => validateProjectOptions({ name, template: 'react-vite' })).toThrowError(
        ValidationError,
      );
    }
  });

  it('reports unknown templates with the available ids', () => {
    try {
      validateProjectOptions({ name: 'demo', template: 'hono-api' });
      throw new Error('expected validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(TemplateNotFoundError);
      const notFound = error as TemplateNotFoundError;
      expect(notFound.details?.available).toEqual([...TEMPLATE_IDS]);
    }
  });

  it('rejects non-object input', () => {
    for (const input of [null, 'demo', 42, ['demo']]) {
      expect(() => validateProjectOptions(input)).toThrowError(ValidationError);
    }
  });

  it('rejects invalid names', () => {
    for (const name of ['', '   ', '{{bad}}', '..', 'ends-', 'has space', '-leading']) {
      expect(() => validateProjectOptions({ name, template: 'react-vite' })).toThrowError(
        ValidationError,
      );
    }
  });
});

describe('toPackageName', () => {
  it('normalizes friendly names', () => {
    expect(toPackageName('Hello World!')).toBe('hello-world');
    expect(toPackageName('  Spaced  Name  ')).toBe('spaced-name');
    expect(toPackageName('already-fine')).toBe('already-fine');
  });

  it('collapses unsupported characters and separators', () => {
    expect(toPackageName('a///b')).toBe('a-b');
    expect(toPackageName('a***b')).toBe('a-b');
  });

  it('throws when nothing usable is left', () => {
    expect(() => toPackageName('***')).toThrowError(ValidationError);
  });
});
