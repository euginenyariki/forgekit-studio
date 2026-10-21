# Web studio

`apps/studio` is a Next.js (App Router) app that exposes the generator over a small UI and two API
routes. It never writes to the server's disk — projects are planned in memory and streamed as a zip.

## Running

```bash
pnpm dev        # builds core + templates, then `next dev` on http://localhost:3000
```

For a production build served locally:

```bash
pnpm --filter forgekit-studio build
pnpm --filter forgekit-studio start
```

## Pages

| Route               | Renders                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `/`                 | Template catalog: category, file count, size, tags                |
| `/build/[template]` | Builder: project name, config fields, live file preview, download |

The catalog and template metadata are read on the server directly from `@forgekit/core`, so the
builder form is populated with each template's real config fields and defaults.

## API

Both routes accept `application/json` or `application/x-www-form-urlencoded` bodies. For form bodies,
config values are read from fields named `config.<key>`.

### `POST /api/plan`

Validates the request and returns the file manifest without writing anything.

```bash
curl -X POST localhost:3000/api/plan \
  -H 'content-type: application/json' \
  -d '{"name":"my-app","template":"react-vite","config":{"port":"5174"}}'
```

```json
{
  "projectName": "my-app",
  "packageName": "my-app",
  "fileCount": 14,
  "totalBytes": 11020,
  "files": [{ "relativePath": "src/App.tsx", "size": 2167 }]
}
```

### `POST /api/download`

Same body; returns `application/zip` with a `Content-Disposition: attachment` header naming the
archive after the project.

```bash
curl -X POST localhost:3000/api/download \
  -H 'content-type: application/json' \
  -d '{"name":"my-app","template":"react-vite"}' -o my-app.zip
```

## Errors

Failures use the engine's error codes mapped to HTTP statuses (`src/lib/http.ts`):

| Code                                | Status |
| ----------------------------------- | ------ |
| `VALIDATION_ERROR`, `UNSAFE_PATH`   | 400    |
| `TEMPLATE_NOT_FOUND`                | 404    |
| `TARGET_NOT_EMPTY`, `FILE_CONFLICT` | 409    |
| `LIMIT_EXCEEDED`                    | 413    |
| anything else                       | 500    |

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid configuration for template \"react-vite\""
  }
}
```

## Notes on bundling

The studio imports the Node build of `@forgekit/core`, and `@forgekit/templates` resolves its own
filesystem root in a bundler-safe way (see [architecture](architecture.md)). The download route zips
files in memory, so no temporary directories are created on the server.

## Support

ForgeKit is built by Eugine Nyariki.

- Support on Ko-fi — <https://ko-fi.com/euginestark>
- Buy me a soda — <https://buymesoda.com/W2nsVZsQNQXjfqwZH6FepWewxOI2>
