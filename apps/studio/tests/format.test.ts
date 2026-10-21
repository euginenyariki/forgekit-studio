import { describe, expect, it } from 'vitest';

import { formatBytes, formatDuration, toPackageName } from '@/lib/format';

describe('formatBytes', () => {
  it('renders bytes, kilobytes and megabytes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(10 * 1024 + 819)).toBe('10.8 KB');
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB');
  });
});

describe('formatDuration', () => {
  it('switches units at one second', () => {
    expect(formatDuration(250)).toBe('250 ms');
    expect(formatDuration(1500)).toBe('1.50 s');
  });
});

describe('toPackageName', () => {
  it('slugifies names into npm-safe package names', () => {
    expect(toPackageName('My Cool App')).toBe('my-cool-app');
    expect(toPackageName('  123 store!! ')).toBe('store');
    expect(toPackageName('---')).toBe('forgekit-app');
  });
});
