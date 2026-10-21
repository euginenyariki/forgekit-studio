/**
 * Shared ESLint flat configuration for ForgeKit workspaces.
 *
 * Import from the workspace package:
 *   import base from '@forgekit/config/eslint';
 */
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Rules that apply to every TypeScript/JavaScript file in the repository. */
export const baseRules = {
  '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    },
  ],
  '@typescript-eslint/no-explicit-any': 'warn',
  eqeqeq: ['error', 'smart'],
  'no-var': 'error',
  'prefer-const': 'error',
  'object-shorthand': 'error',
};

/** Paths that are generated or vendored and must never be linted. */
export const baseIgnores = [
  '**/node_modules/**',
  '**/.pnpm-store/**',
  '**/dist/**',
  '**/build/**',
  '**/out/**',
  '**/.next/**',
  '**/coverage/**',
  '**/test-results/**',
  '**/*.d.ts',
  'packages/templates/templates/**/content/**',
  'pnpm-lock.yaml',
];

/** Flat config array shared by every package in the repository. */
export const baseConfig = [
  { ignores: baseIgnores },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2023 },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    rules: baseRules,
  },
  {
    files: ['**/*.mjs', '**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/tests/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];

export default baseConfig;
