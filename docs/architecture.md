# Architecture

ForgeKit is a pnpm workspace. One engine (`@forgekit/core`) drives a CLI and a Next.js web app, both
reading the same template catalog (`@forgekit/templates`).

```
templates ──▶ core ──▶ cli
                 └──▶ studio (Next.js)
```

## Packages

### `@forgekit/templates`

Owns the template files and their `template.json` manifests. It exposes an allowlist of template ids
(`TEMPLATE_IDS`) plus filesystem helpers (`getTemplatesRoot`, `getTemplateDir`,
`getTemplateContentDir`, `readTemplateJson`). Ids are validated against the allowlist and every
resolved path is checked to stay inside the templates root, so no directory traversal is possible.

The templates root is resolved without relying on a single mechanism: it first tries this module's
own `import.meta.url`, and, when a bundler has rewritten `import.meta` (Next.js/Turbopack/Webpack),
falls back to walking up from `process.cwd()` to find `@forgekit/templates/templates`. This keeps the
package working both as native ESM and bundled into the studio.

### `@forgekit/core`

The engine, split into two entry points:

- **`@forgekit/core/schema`** — dependency-free, Node-free modules (errors, validation, rendering,
  template config, shared types, support links). Safe to import from client bundles.
- **`@forgekit/core`** — everything in `schema` plus the filesystem layer (registry, generator,
  archive).

Key modules:

| Module               | Responsibility                                                        |
| -------------------- | --------------------------------------------------------------------- |
| `registry.ts`        | Manifest parsing, catalog listing, template path resolution           |
| `schemas.ts`         | Zod validation of project options; `toPackageName`                    |
| `template-config.ts` | Per-template config schemas, defaults and render variables            |
| `render.ts`          | `{{variable}}` template rendering with strict unknown-variable errors |
| `fs-utils.ts`        | Directory walking, safe path joins, POSIX relative paths              |
| `generator.ts`       | `planFiles` / `planProject` / `generateProject` / `writeProject`      |
| `archive.ts`         | In-memory zip creation (`fflate`)                                     |
| `errors.ts`          | `ForgeKitError` hierarchy with stable `code`s and HTTP/exit mapping   |
| `support.ts`         | Canonical author + support links shared by CLI, studio and READMEs    |

Generation is **plan-then-write**: every file is read and rendered in memory before the destination
is touched, so a rendering error can never leave a half-written project behind. When the destination
does not exist, files are written to a sibling temp directory and atomically renamed into place.

### `@forgekit/cli`

A thin wrapper over the engine. `src/args.ts` parses flags, `src/config-values.ts` coerces
`--config key=value` pairs, and `src/cli.ts` implements `list`, `info`, `config`, `create` and
`help`. Exit codes: `0` success, `1` generation/IO failure, `2` usage error.

### `forgekit-studio`

A Next.js App Router app. Server components read the catalog and template metadata directly from
`@forgekit/core`; two route handlers expose the engine over HTTP:

| Route           | Method | Purpose                                       |
| --------------- | ------ | --------------------------------------------- |
| `/api/plan`     | POST   | Validate options and return the file manifest |
| `/api/download` | POST   | Validate options and stream a project zip     |

Both accept JSON or form-encoded bodies and map `ForgeKitError` codes to HTTP statuses via
`src/lib/http.ts`. The builder UI (`src/app/build/[template]/builder-form.tsx`) debounces calls to
`/api/plan` for a live preview and requests `/api/download` to save the zip.

### `@forgekit/config`

Shared `tsconfig` presets (`base`, `node`, `react`), a flat ESLint base, and Prettier settings.

## Data flow

1. A caller (CLI, API, or `core` directly) provides `{ name, template, targetDir?, config? }`.
2. `validateProjectOptions` resolves the template, applies defaults and validates `config` (an
   unknown key is rejected; a type or range error is reported with its dotted path).
3. `planFiles` walks the template `content/` directory, renders each file, renames dotfiles
   (`gitignore` → `.gitignore`) and enforces size/count limits.
4. The files are either written to disk (`generateProject`) or zipped (`createArchiveBuffer`).

## Error model

All expected failures throw a `ForgeKitError` with a stable `code` (`VALIDATION_ERROR`,
`TEMPLATE_NOT_FOUND`, `TARGET_NOT_EMPTY`, `LIMIT_EXCEEDED`, …). The CLI maps codes to exit codes and
the studio maps them to HTTP statuses, so neither layer string-matches an error message.

## Testing

- Unit tests live beside each package (`packages/*/tests`).
- `tests/integration` generates every template, asserts the on-disk result, and — when run with
  `pnpm test:templates` — installs and type-checks a generated project.

## Support

ForgeKit is built by Eugine Nyariki.

- Support on Ko-fi — <https://ko-fi.com/euginestark>
- Buy me a soda — <https://buymesoda.com/W2nsVZsQNQXjfqwZH6FepWewxOI2>
