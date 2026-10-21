import { defineConfig } from 'vitest/config';

/**
 * `pnpm test:templates` runs Vitest with `--mode install`, which flips
 * `__FORGEKIT_INSTALL__` so the slow install-and-typecheck test is included.
 */
export default defineConfig(({ mode }) => ({
  define: {
    __FORGEKIT_INSTALL__: JSON.stringify(mode === 'install'),
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 300_000,
    hookTimeout: 300_000,
  },
}));
