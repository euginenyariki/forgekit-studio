# {{projectName}}

{{description}}

Generated with ForgeKit Studio. Node.js, Express 5, TypeScript and Zod.

## Getting started

```bash
{{installCommand}}
cp .env.example .env
{{runCommand}} dev
```

The API listens on http://localhost:{{port}}.

| Command                    | What it does                                           |
| -------------------------- | ------------------------------------------------------ |
| `{{runCommand}} dev`       | Start the server with `tsx watch` and reload on change |
| `{{runCommand}} build`     | Compile TypeScript to `dist/`                          |
| `{{runCommand}} start`     | Run the compiled server                                |
| `{{runCommand}} typecheck` | Typecheck without emitting files                       |

## Endpoints

| Method | Path             | Description                               |
| ------ | ---------------- | ----------------------------------------- |
| GET    | `/`              | Service metadata                          |
| GET    | `/api/health`    | Liveness probe with uptime                |
| GET    | `/api/items`     | List items                                |
| POST   | `/api/items`     | Create an item (`{"name": "First item"}`) |
| GET    | `/api/items/:id` | Read one item                             |
| PATCH  | `/api/items/:id` | Update name or done flag                  |
| DELETE | `/api/items/:id` | Delete an item                            |

```bash
curl -s http://localhost:{{port}}/api/health
curl -s -X POST http://localhost:{{port}}/api/items \
  -H 'content-type: application/json' \
  -d '{"name":"First item"}'
```

## Configuration

| Variable      | Default          | Notes                                  |
| ------------- | ---------------- | -------------------------------------- |
| `PORT`        | `{{port}}`       | HTTP port                              |
| `CORS_ORIGIN` | `{{corsOrigin}}` | Allowed browser origin, or `*` for any |
| `NODE_ENV`    | `development`    | `production` hides error details       |

Values are validated with Zod at startup, so a typo fails fast instead of at request time.

## Project structure

```
.
├── src
│   ├── app.ts          Express app factory (middleware, routes, error handling)
│   ├── env.ts          Environment schema with defaults
│   ├── lib
│   │   ├── http.ts     HttpError and payload validation helpers
│   │   └── store.ts    In-memory item repository
│   ├── routes
│   │   ├── health.ts
│   │   └── items.ts
│   └── server.ts       Entry point with graceful shutdown
└── tsconfig.json
```

## Next steps

- Replace `src/lib/store.ts` with your database client; the route handlers only use `list`, `get`, `create`, `update` and `remove`.
- Add authentication middleware in `src/app.ts` before the routes.
- Add tests with your runner of choice against `createApp()`.
