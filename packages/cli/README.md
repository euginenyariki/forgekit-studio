# @forgekit/cli

Command line interface for ForgeKit. Generate a project from a versioned
template without leaving the terminal.

```bash
npx @forgekit/cli list
npx @forgekit/cli create my-app --template react-vite
```

## Commands

| Command                  | Description                                         |
| ------------------------ | --------------------------------------------------- |
| `forgekit list`          | List available templates with file counts and size  |
| `forgekit info <t>`      | Show a template's description, commands and options |
| `forgekit config <t>`    | Show the configurable options and their defaults    |
| `forgekit create <name>` | Generate a project from a template                  |
| `forgekit help`          | Show usage                                          |

Pass `--json` to any command for machine-readable output.

### `create` options

| Option                | Description                               |
| --------------------- | ----------------------------------------- |
| `-t, --template <id>` | Template to use (required)                |
| `-d, --dir <path>`    | Destination directory (default: `<name>`) |
| `-c, --config <k=v>`  | Set a template option (repeatable)        |
| `--dry-run`           | Plan the project without writing files    |
| `--overwrite`         | Allow writing into a non-empty directory  |

```bash
forgekit create api --template express-api --config port=8080 --config packageManager=pnpm
forgekit create store --template fullstack --dir projects/store
```

## Exit codes

| Code | Meaning                          |
| ---- | -------------------------------- |
| `0`  | Success                          |
| `1`  | Generation or IO failure         |
| `2`  | Usage error (bad flags or input) |

## Support

ForgeKit is built by Eugine Nyariki. If it saves you time, you can support the work:

- Support on Ko-fi — <https://ko-fi.com/euginestark>
- Buy me a soda — <https://buymesoda.com/W2nsVZsQNQXjfqwZH6FepWewxOI2>
