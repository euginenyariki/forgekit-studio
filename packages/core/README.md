# @forgekit/core

The ForgeKit generator engine: template registry, validation, rendering, safe file generation and
in-memory archiving. It powers both [`@forgekit/cli`](../cli) and the ForgeKit Studio web app.

## Install

```bash
npm install @forgekit/core
```

## Entry points

- `@forgekit/core` — the full engine (Node.js only; reads and writes the filesystem).
- `@forgekit/core/schema` — dependency-free, Node-free exports (errors, validation, rendering,
  template config, shared types and support links). Safe for client bundles.

## Usage

```ts
import { generateProject, planProject, listTemplates } from '@forgekit/core';

// List the catalog
const templates = await listTemplates();

// Plan without writing anything (preview file names and sizes)
const plan = await planProject({ name: 'my-app', template: 'react-vite' });
console.log(plan.fileCount, plan.files);

// Generate to disk
await generateProject({
  name: 'my-app',
  template: 'react-vite',
  targetDir: 'projects/my-app',
  config: { port: 5174, packageManager: 'pnpm' },
});
```

To produce a zip without writing to disk:

```ts
import { createArchiveBuffer, planFiles, validateProjectOptions } from '@forgekit/core';

const resolved = validateProjectOptions({ name: 'my-app', template: 'react-vite' });
const { files } = await planFiles(resolved);
const zip = createArchiveBuffer(resolved.name, files);
```

## API

| Export                                              | Description                                       |
| --------------------------------------------------- | ------------------------------------------------- |
| `listTemplates`, `getTemplateInfo`                  | Catalog access                                    |
| `validateProjectOptions`                            | Normalize and validate untrusted options          |
| `validateOptions`                                   | Typed alias for callers that already hold options |
| `planFiles`, `planProject`                          | Plan without writing                              |
| `generateProject`, `writeProject`                   | Write a project (plan-then-write)                 |
| `createArchive`, `createArchiveBuffer`              | Build a zip in memory                             |
| `walkDirectory`, `resolveInside`, `toPosixRelative` | Filesystem helpers                                |
| `ForgeKitError` and subclasses, `isForgeKitError`   | Structured errors with stable codes               |
| `SUPPORT_LINKS`, `AUTHOR_NAME`, `AUTHOR_EMAIL`      | Author and support links                          |

Generation is plan-then-write: all files are rendered in memory first, so a template error never
leaves a partial project behind. Writes to a brand-new destination go through a sibling temp
directory that is atomically renamed into place.

## Support

ForgeKit is built by Eugine Nyariki.

- Support on Ko-fi — <https://ko-fi.com/euginestark>
- Buy me a soda — <https://buymesoda.com/W2nsVZsQNQXjfqwZH6FepWewxOI2>

## License

MIT © Eugine Nyariki
