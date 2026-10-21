import { unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';

import { createArchive, createArchiveBuffer } from '../src/archive.js';
import { ArchiveError } from '../src/errors.js';
import { planFiles } from '../src/generator.js';
import { validateProjectOptions } from '../src/schemas.js';
import type { PlannedFile } from '../src/types.js';

function plannedFiles(entries: Record<string, string>): PlannedFile[] {
  return Object.entries(entries).map(([relativePath, contents]) => ({
    relativePath,
    contents: new Uint8Array(Buffer.from(contents, 'utf8')),
  }));
}

function decode(archive: Uint8Array): Record<string, string> {
  const entries = unzipSync(archive);
  return Object.fromEntries(
    Object.entries(entries).map(([name, bytes]) => [name, Buffer.from(bytes).toString('utf8')]),
  );
}

describe('createArchive', () => {
  it('zips entries under the project folder and preserves contents', () => {
    const archive = createArchive(
      'demo',
      plannedFiles({ 'package.json': '{"name":"demo"}', 'src/main.ts': 'export {};\n' }),
    );

    expect(decode(archive)).toEqual({
      'demo/package.json': '{"name":"demo"}',
      'demo/src/main.ts': 'export {};\n',
    });
  });

  it('archives a real generated plan, dotfiles included', async () => {
    const resolved = validateProjectOptions({ name: 'archived-app', template: 'react-vite' });
    const { files } = await planFiles(resolved);
    const entries = decode(createArchive('archived-app', files));

    expect(Object.keys(entries)).toContain('archived-app/.gitignore');
    expect(Object.keys(entries)).toContain('archived-app/package.json');
    expect(JSON.parse(entries['archived-app/package.json']!).name).toBe('archived-app');
  });

  it('rejects empty inputs', () => {
    expect(() => createArchive('', plannedFiles({ 'a.txt': 'a' }))).toThrowError(ArchiveError);
    expect(() => createArchive('demo', [])).toThrowError(ArchiveError);
  });

  it('rejects unsafe entry paths', () => {
    expect(() => createArchive('demo', plannedFiles({ '../secrets.txt': 'nope' }))).toThrowError(
      ArchiveError,
    );
    expect(() => createArchive('demo', plannedFiles({ '/etc/passwd': 'nope' }))).toThrowError(
      ArchiveError,
    );
  });

  it('returns a Node buffer for HTTP responses', () => {
    const buffer = createArchiveBuffer('demo', plannedFiles({ 'a.txt': 'a' }));
    expect(Buffer.isBuffer(buffer)).toBe(true);
  });
});
