# Template author guide

A template is a directory under `packages/templates/templates/<id>` containing a `template.json`
manifest and a `content/` directory. ForgeKit copies `content/` into the generated project, rendering
`{{variable}}` placeholders along the way.

```
packages/templates/templates/my-template/
├── template.json
└── content/
    ├── package.json
    ├── gitignore          → written as .gitignore
    └── src/index.ts
```

## Registering the id

Add the id to `TEMPLATE_IDS` in `packages/templates/src/ids.ts`:

```ts
export const TEMPLATE_IDS = ['react-vite', 'express-api', 'fullstack', 'my-template'] as const;
```

Then add its config schema, defaults and fields in `packages/core/src/template-config.ts` (see
[Options](#options)). Ids must match `^[a-z0-9][a-z0-9-]*$`.

## `template.json`

```json
{
  "id": "my-template",
  "templateVersion": "1.0.0",
  "name": "My Template",
  "summary": "One line shown in the catalog.",
  "description": "A longer description shown on the builder page.",
  "category": "frontend",
  "tags": ["react", "typescript"],
  "technologies": ["React 19", "TypeScript 5"],
  "setupRequirements": ["Node.js 20.19 or newer"],
  "commands": {
    "dev": "{{packageManager}} run dev",
    "build": "{{packageManager}} run build",
    "typecheck": "{{packageManager}} run typecheck"
  }
}
```

| Field               | Rules                                                  |
| ------------------- | ------------------------------------------------------ |
| `id`                | Must equal the directory name                          |
| `templateVersion`   | Semver, e.g. `1.0.0`                                   |
| `name`              | ≤ 80 chars                                             |
| `summary`           | ≤ 200 chars                                            |
| `description`       | ≤ 2000 chars                                           |
| `category`          | One of `frontend`, `backend`, `fullstack`              |
| `tags`              | Non-empty strings                                      |
| `technologies`      | Non-empty strings                                      |
| `setupRequirements` | Non-empty strings                                      |
| `commands`          | `dev`, `build`, `typecheck` — may use render variables |

## Render variables

Placeholders use `{{name}}` and are resolved from the validated config. An unknown variable is an
error, not an empty string, so typos fail the build instead of shipping broken files.

| Variable         | Source                                        |
| ---------------- | --------------------------------------------- |
| `projectName`    | The `name` option                             |
| `packageName`    | npm-safe form of `name`                       |
| `description`    | `config.description`                          |
| `packageManager` | `config.packageManager` (`npm`/`pnpm`/`yarn`) |
| `installCommand` | e.g. `pnpm install`                           |
| `runCommand`     | e.g. `pnpm run`                               |
| `port`           | `config.port` (templates that define it)      |
| `webPort`        | `config.webPort` (fullstack)                  |
| `apiPort`        | `config.apiPort` (fullstack)                  |
| `corsOrigin`     | `config.corsOrigin` (express-api)             |

In the example template, `commands.dev` becomes `pnpm run dev` when
`config.packageManager` is `pnpm`.

## Dotfiles

npm strips some dotfiles from published tarballs, so store them **without** the leading dot. Both the
catalog and the generator map them back on the way out via `TEMPLATE_FILE_RENAMES`:

| Stored name         | Written as           |
| ------------------- | -------------------- |
| `gitignore`         | `.gitignore`         |
| `editorconfig`      | `.editorconfig`      |
| `npmrc`             | `.npmrc`             |
| `env.example`       | `.env.example`       |
| `env.local.example` | `.env.local.example` |

## Options

Define the template's config in `packages/core/src/template-config.ts`:

```ts
export const myTemplateConfigSchema = z.object({
  description: descriptionSchema.default('A project generated with ForgeKit.'),
  port: portSchema.default(3000),
  packageManager: packageManagerSchema.default('npm'),
});
```

Then add it to `configSchemas`, `defaultConfigs` and `configFields`. Each field in `configFields`
drives the CLI `--config` help and the studio form:

```ts
export const configFields = {
  // ...
  'my-template': [
    { key: 'description', label: 'Description', type: 'string', help: '…', required: true },
    { key: 'port', label: 'Port', type: 'number', help: '…', required: true, min: 1, max: 65535 },
    {
      key: 'packageManager',
      label: 'Package manager',
      type: 'select',
      help: '…',
      required: true,
      options: [
        { value: 'npm', label: 'npm' },
        { value: 'pnpm', label: 'pnpm' },
        { value: 'yarn', label: 'yarn' },
      ],
    },
  ],
};
```

## Limits and safety

- Only UTF-8 text templates are supported; a file containing a NUL byte is rejected as binary.
- Limits (default: 400 files, 2 MiB per file, 8 MiB total) are enforced while planning.
- Paths are validated so a template can never write outside the destination directory.
- Two output paths that differ only by case are rejected.

## Testing a template

1. `pnpm --filter @forgekit/templates build && pnpm --filter @forgekit/core build`
2. Generate it:

   ```bash
   node packages/cli/dist/bin.js create demo --template my-template --dry-run
   ```

3. Run the integration tests, which generate and verify every template:

   ```bash
   pnpm test:templates
   ```

## Support

ForgeKit is built by Eugine Nyariki.

- Support on Ko-fi — <https://ko-fi.com/euginestark>
- Buy me a soda — <https://buymesoda.com/W2nsVZsQNQXjfqwZH6FepWewxOI2>
