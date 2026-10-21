import { describe, expect, it } from 'vitest';

import { UnsafePathError } from '../src/errors.js';
import { assertSafeRelativePath, resolveInside, toPosixRelative } from '../src/fs-utils.js';

describe('assertSafeRelativePath', () => {
  it('accepts ordinary template paths', () => {
    expect(() => assertSafeRelativePath('src/components/Button.tsx')).not.toThrow();
    expect(() => assertSafeRelativePath('.gitignore')).not.toThrow();
  });

  it('rejects traversal and absolute paths', () => {
    for (const candidate of ['../secrets', 'a/../b', '/etc/passwd', 'C:\\Windows\\system32']) {
      expect(() => assertSafeRelativePath(candidate)).toThrowError(UnsafePathError);
    }
  });

  it('rejects reserved characters and control characters', () => {
    expect(() => assertSafeRelativePath('src/weird|file.ts')).toThrowError(UnsafePathError);
    expect(() => assertSafeRelativePath('src/quote".ts')).toThrowError(UnsafePathError);
    expect(() => assertSafeRelativePath(`src/${String.fromCharCode(7)}.ts`)).toThrowError(
      UnsafePathError,
    );
  });

  it('rejects segments ending with a space or a dot', () => {
    expect(() => assertSafeRelativePath('src/Button .tsx')).not.toThrow();
    expect(() => assertSafeRelativePath('src/dir /file.ts')).toThrowError(UnsafePathError);
    expect(() => assertSafeRelativePath('src/file.')).toThrowError(UnsafePathError);
  });

  it('rejects empty paths and empty segments', () => {
    expect(() => assertSafeRelativePath('')).toThrowError(UnsafePathError);
    expect(() => assertSafeRelativePath('src//file.ts')).toThrowError(UnsafePathError);
  });
});

describe('resolveInside', () => {
  it('resolves a path inside the base directory', () => {
    const base = '/tmp/base';
    expect(resolveInside(base, 'src/a.ts')).toBe('/tmp/base/src/a.ts');
  });

  it('rejects traversal attempts', () => {
    expect(() => resolveInside('/tmp/base', '../escape.ts')).toThrowError(UnsafePathError);
  });
});

describe('toPosixRelative', () => {
  it('returns posix paths on every platform', () => {
    expect(toPosixRelative('src/components/Button.tsx')).toBe('src/components/Button.tsx');
  });
});
