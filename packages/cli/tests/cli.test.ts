import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { SUPPORT_LINKS } from '@forgekit/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { EXIT, run, recordingIO } from '../src/index.js';

let cwd = '';

beforeEach(async () => {
  cwd = await mkdtemp(path.join(tmpdir(), 'forgekit-cli-'));
});

afterEach(async () => {
  await rm(cwd, { recursive: true, force: true });
});

describe('forgekit list', () => {
  it('prints every template as a table', async () => {
    const io = recordingIO(cwd);
    const code = await run(['list'], io);

    expect(code).toBe(EXIT.ok);
    const output = io.outLines.join('\n');
    expect(output).toContain('react-vite');
    expect(output).toContain('express-api');
    expect(output).toContain('fullstack');
  });

  it('prints machine-readable JSON', async () => {
    const io = recordingIO(cwd);
    await run(['list', '--json'], io);

    const parsed = JSON.parse(io.outLines.join('\n')) as { id: string }[];
    expect(parsed.map((entry) => entry.id)).toContain('fullstack');
  });
});

describe('forgekit info', () => {
  it('describes a template', async () => {
    const io = recordingIO(cwd);
    const code = await run(['info', 'fullstack'], io);

    expect(code).toBe(EXIT.ok);
    const output = io.outLines.join('\n');
    expect(output).toContain('Full-stack');
    expect(output).toContain('npm run dev');
  });

  it('fails with a clear message for an unknown template', async () => {
    const io = recordingIO(cwd);
    const code = await run(['info', 'nope'], io);

    expect(code).toBe(EXIT.failure);
    expect(io.errLines.join('\n')).toContain('does not exist');
  });
});

describe('forgekit config', () => {
  it('lists configurable options', async () => {
    const io = recordingIO(cwd);
    const code = await run(['config', 'react-vite'], io);

    expect(code).toBe(EXIT.ok);
    expect(io.outLines.join('\n')).toContain('packageManager');
  });
});

describe('forgekit create', () => {
  it('generates a project in the current working directory', async () => {
    const io = recordingIO(cwd);
    const code = await run(['create', 'demo', '--template', 'react-vite'], io);

    expect(code).toBe(EXIT.ok);
    expect(await readdir(cwd)).toEqual(['demo']);
    expect(io.outLines.join('\n')).toContain('Created react-vite project');
  });

  it('applies typed config overrides', async () => {
    const io = recordingIO(cwd);
    const code = await run(
      [
        'create',
        'api',
        '--template',
        'express-api',
        '--config',
        'port=8080',
        '--config',
        'packageManager=pnpm',
      ],
      io,
    );

    expect(code).toBe(EXIT.ok);
    const output = io.outLines.join('\n');
    expect(output).toContain('pnpm install');
  });

  it('writes nothing on a dry run', async () => {
    const io = recordingIO(cwd);
    const code = await run(['create', 'ghost', '--template', 'react-vite', '--dry-run'], io);

    expect(code).toBe(EXIT.ok);
    expect(await readdir(cwd)).toEqual([]);
    expect(io.outLines.join('\n')).toContain('Dry run: nothing was written.');
  });

  it('rejects a missing template flag', async () => {
    const io = recordingIO(cwd);
    const code = await run(['create', 'demo'], io);

    expect(code).toBe(EXIT.usage);
    expect(io.errLines.join('\n')).toContain('--template');
  });

  it('rejects an unknown config key', async () => {
    const io = recordingIO(cwd);
    const code = await run(
      ['create', 'demo', '--template', 'react-vite', '--config', 'colour=red'],
      io,
    );

    expect(code).toBe(EXIT.usage);
    expect(io.errLines.join('\n')).toContain('Unknown option');
  });
});

describe('help and version', () => {
  it('prints the version', async () => {
    const io = recordingIO(cwd);
    const code = await run(['--version'], io);

    expect(code).toBe(EXIT.ok);
    expect(io.outLines[0]).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('prints help with the support links', async () => {
    const io = recordingIO(cwd);
    await run(['--help'], io);

    const output = io.outLines.join('\n');
    for (const link of SUPPORT_LINKS) {
      expect(output).toContain(link.url);
    }
  });

  it('fails on an unknown option', async () => {
    const io = recordingIO(cwd);
    const code = await run(['list', '--frobnicate'], io);

    expect(code).toBe(EXIT.usage);
    expect(io.errLines.join('\n')).toContain('Unknown option');
  });
});
