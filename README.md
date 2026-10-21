# ForgeKit Studio

ForgeKit scaffolds working projects from versioned, self-contained templates. It ships as a
monorepo with three ways to use the same engine:

- **ForgeKit Studio** — a Next.js web app: browse the catalog, configure a project, preview every
  generated file and download it as a zip.
- **`@forgekit/cli`** — a terminal generator: `forgekit create my-app --template react-vite`.
- **`@forgekit/core`** — the generator engine, usable directly from Node.js.

Every path shares the same validation, rendering and safety rules, and the same template catalog, so
a project you preview in the browser is byte-for-byte what the CLI writes.

## Quick start

```bash
pnpm install

# Web studio (http://localhost:3000)
pnpm dev

# CLI
pnpm --filter @forgekit/cli build
node packages/cli/dist/bin.js list
node packages/cli/dist/bin.js create my-app --template react-vite
```

## Repository layout

| Path                 | Package                       | What it does                                              |
| -------------------- | ----------------------------- | --------------------------------------------------------- |
| `apps/studio`        | `forgekit-studio`             | Next.js web studio (catalog, builder, plan/download API)  |
| `packages/core`      | `@forgekit/core`              | Generator engine: registry, validation, rendering, zip    |
| `packages/templates` | `@forgekit/templates`         | The shipped templates and their manifests                 |
| `packages/cli`       | `@forgekit/cli`               | Command line interface                                    |
| `packages/config`    | `@forgekit/config`            | Shared TypeScript, ESLint and Prettier configuration      |
| `tests/integration`  | `@forgekit-tests/integration` | Generate-every-template tests, optional install/typecheck |

## Templates

| Id            | Category  | Summary                                        |
| ------------- | --------- | ---------------------------------------------- |
| `react-vite`  | frontend  | React 19 + Vite 8 + TypeScript single-page app |
| `express-api` | backend   | Express 5 + TypeScript API                     |
| `fullstack`   | fullstack | React web app + Express API in one repo        |

See [docs/template-guide.md](docs/template-guide.md) to author a new template.

## Common scripts

| Command               | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `pnpm dev`            | Build core/templates, then run the studio dev server |
| `pnpm build`          | Build every package and the studio                   |
| `pnpm test`           | Build core/templates, then run all package tests     |
| `pnpm test:templates` | Integration tests **including** install + typecheck  |
| `pnpm lint`           | ESLint across the monorepo                           |
| `pnpm typecheck`      | Type-check every package                             |
| `pnpm format`         | Format with Prettier                                 |
| `pnpm check`          | format:check + lint + typecheck + test               |

## Documentation

- [Architecture](docs/architecture.md)
- [CLI reference](docs/cli.md)
- [Web studio](docs/studio.md)
- [Template author guide](docs/template-guide.md)

## Support

ForgeKit is built by Eugine Nyariki. If it saves you time, you can support the work:

- Support on Ko-fi — <https://ko-fi.com/euginestark>
- Buy me a soda — <https://buymesoda.com/W2nsVZsQNQXjfqwZH6FepWewxOI2>

## License

MIT © Eugine Nyariki
