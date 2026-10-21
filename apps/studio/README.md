# forgekit-studio

The ForgeKit web studio: browse the template catalog, configure a project, preview every generated
file and download it as a zip. Built with Next.js (App Router) and React 19; generation runs
in-process through [`@forgekit/core`](../../packages/core) and never writes to the server's disk.

## Develop

From the repository root:

```bash
pnpm dev        # builds core + templates, then starts next dev on http://localhost:3000
```

Or from this directory (after `pnpm --filter @forgekit/core build`):

```bash
pnpm dev
pnpm build
pnpm start
```

## Routes

| Route                | Description                                     |
| -------------------- | ----------------------------------------------- |
| `/`                  | Template catalog                                |
| `/build/[template]`  | Builder with live file preview and zip download |
| `POST /api/plan`     | Validate options, return the file manifest      |
| `POST /api/download` | Validate options, stream a project zip          |

See [docs/studio.md](../../docs/studio.md) for the API contract and error mapping.

## Tests

```bash
pnpm test       # vitest: request coercion, formatting and catalog
```

## Support

ForgeKit is built by Eugine Nyariki.

- Support on Ko-fi — <https://ko-fi.com/euginestark>
- Buy me a soda — <https://buymesoda.com/W2nsVZsQNQXjfqwZH6FepWewxOI2>

## License

MIT © Eugine Nyariki
