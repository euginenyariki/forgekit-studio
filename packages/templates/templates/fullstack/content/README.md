# {{projectName}}

{{description}}

Generated with ForgeKit Studio: a Vite + React web app and an Express 5 + TypeScript API in
one workspace, wired together through a development proxy.

## Getting started

```bash
{{installCommand}}
{{runCommand}} dev
```

- Web app: http://localhost:{{webPort}}
- API: http://localhost:{{apiPort}}
- Requests from the web app to `/api/*` are proxied to the API by Vite, so the browser stays on a single origin during development.

| Command                    | What it does                                 |
| -------------------------- | -------------------------------------------- |
| `{{runCommand}} dev`       | Run the API and the web dev server together  |
| `{{runCommand}} build`     | Build the API and the web app for production |
| `{{runCommand}} typecheck` | Typecheck both workspaces                    |
| `{{runCommand}} start`     | Run the compiled API                         |

## Layout

```
.
├── apps
│   ├── api                 Express 5 + Zod API on port {{apiPort}}
│   │   └── src
│   │       ├── app.ts      Middleware, routes and error handling
│   │       ├── env.ts      Environment schema with defaults
│   │       ├── lib         HttpError, payload validation, in-memory store
│   │       ├── routes      /api/health and /api/items
│   │       └── server.ts   Entry point with graceful shutdown
│   └── web                 React + Vite + Tailwind client on port {{webPort}}
│       ├── index.html
│       ├── src
│       │   ├── App.tsx
│       │   ├── components  Item board
│       │   └── lib         Typed fetch helpers for /api/items
│       └── vite.config.ts  Dev proxy for /api
└── package.json            Workspaces, dev/build/typecheck scripts
```

## How the two apps talk

The web app calls relative URLs such as `/api/items`. During development Vite proxies
`/api` to `http://localhost:{{apiPort}}` (see `apps/web/vite.config.ts`). In production,
serve the built client from a static host and point it at the API with `VITE_API_URL`,
or put both behind the same reverse proxy.

## Next steps

- Replace the in-memory store in `apps/api/src/lib/store.ts` with a real database.
- Add authentication middleware in `apps/api/src/app.ts`.
- Add tests for the API routes against `createApp()` and component tests for the client.
