# @forgekit/config

Shared, zero-build configuration used by every workspace package:

| Export                            | Contents                                                      |
| --------------------------------- | ------------------------------------------------------------- |
| `@forgekit/config/eslint`         | Flat ESLint config shared across the repo                     |
| `@forgekit/config/prettier`       | Prettier options (root `prettier.config.mjs` re-exports them) |
| `@forgekit/config/tsconfig/base`  | Base `compilerOptions` for Node ESM packages                  |
| `@forgekit/config/tsconfig/node`  | Base + `@types/node`                                          |
| `@forgekit/config/tsconfig/react` | Base + React/JSX/bundler settings                             |

## Usage

```jsonc
// packages/<name>/tsconfig.json
{
  "extends": "../../packages/config/tsconfig/node.json",
  "compilerOptions": { "rootDir": "src", "outDir": "dist" },
  "include": ["src"],
}
```

```js
// eslint.config.mjs
import baseConfig from '@forgekit/config/eslint';
```

```js
// prettier.config.mjs
import { readFileSync } from 'node:fs';
const base = new URL('./packages/config/prettier/base.json', import.meta.url);
export default JSON.parse(readFileSync(base, 'utf8'));
```

Prettier does not support `extends` in JSON config, so the root config reads the
shared options explicitly instead.

This package is private and is not published to npm.

## Support

ForgeKit is built by Eugine Nyariki.

- Support on Ko-fi — <https://ko-fi.com/euginestark>
- Buy me a soda — <https://buymesoda.com/W2nsVZsQNQXjfqwZH6FepWewxOI2>
