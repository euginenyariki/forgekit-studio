# CLI reference

The `@forgekit/cli` package installs a `forgekit` binary.

```bash
# from npm
npx @forgekit/cli list

# from this repo
pnpm --filter @forgekit/cli build
node packages/cli/dist/bin.js list
```

## Commands

| Command                  | Description                                     |
| ------------------------ | ----------------------------------------------- |
| `forgekit list`          | List templates with file counts and size        |
| `forgekit info <id>`     | Description, commands, technologies and options |
| `forgekit config <id>`   | Configurable options and their defaults         |
| `forgekit create <name>` | Generate a project from a template              |
| `forgekit help`          | Usage                                           |

Add `--json` to any command for machine-readable output.

## `create` options

| Option                | Description                               |
| --------------------- | ----------------------------------------- |
| `-t, --template <id>` | Template to use (required)                |
| `-d, --dir <path>`    | Destination directory (default: `<name>`) |
| `-c, --config <k=v>`  | Set a template option (repeatable)        |
| `--dry-run`           | Plan the project without writing files    |
| `--overwrite`         | Allow writing into a non-empty directory  |

```bash
forgekit create my-app --template react-vite
forgekit create api --template express-api --config port=8080 --config packageManager=pnpm
forgekit create store --template fullstack --dir projects/store
forgekit create preview --template fullstack --dry-run
```

## Exit codes

| Code | Meaning                  |
| ---- | ------------------------ |
| `0`  | Success                  |
| `1`  | Generation or IO failure |
| `2`  | Usage error              |

## Support

ForgeKit is built by Eugine Nyariki.

- Support on Ko-fi — <https://ko-fi.com/euginestark>
- Buy me a soda — <https://buymesoda.com/W2nsVZsQNQXjfqwZH6FepWewxOI2>
