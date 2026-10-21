# @forgekit/templates

Versioned starter templates for the ForgeKit generator, plus the filesystem helpers that locate
them. Consumed by [`@forgekit/core`](../core); template authors usually only touch
`templates/<id>/` and `src/ids.ts`.

## Layout

```
src/ids.ts                     → the allowlist of template ids
templates/<id>/template.json   → manifest (name, category, tags, commands, …)
templates/<id>/content/        → files copied into a generated project
```

## Shipped templates

| Id            | Category  | Summary                                        |
| ------------- | --------- | ---------------------------------------------- |
| `react-vite`  | frontend  | React 19 + Vite 8 + TypeScript single-page app |
| `express-api` | backend   | Express 5 + TypeScript API                     |
| `fullstack`   | fullstack | React web app + Express API in one repo        |

## API

```ts
import {
  TEMPLATE_IDS,
  isTemplateId,
  getTemplatesRoot,
  getTemplateDir,
  getTemplateContentDir,
  readTemplateJson,
  readAllTemplateJson,
} from '@forgekit/templates';
```

Ids are checked against the allowlist and every resolved path is verified to stay inside the
templates root, so directory traversal is impossible. The templates root is resolved in a
bundler-safe way so the package also works when bundled by Next.js.

## Adding a template

See [docs/template-guide.md](../../docs/template-guide.md).

## Support

ForgeKit is built by Eugine Nyariki.

- Support on Ko-fi — <https://ko-fi.com/euginestark>
- Buy me a soda — <https://buymesoda.com/W2nsVZsQNQXjfqwZH6FepWewxOI2>

## License

MIT © Eugine Nyariki
