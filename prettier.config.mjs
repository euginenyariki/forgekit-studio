import { readFileSync } from 'node:fs';

import { fileURLToPath } from 'node:url';

/**
 * Prettier does not understand JSON `extends`, so the shared options in
 * `@forgekit/config/prettier` are loaded explicitly here. Keeping the values
 * in one JSON file means non-JS tooling can still read them.
 */
const basePath = fileURLToPath(new URL('./packages/config/prettier/base.json', import.meta.url));

export default JSON.parse(readFileSync(basePath, 'utf8'));
