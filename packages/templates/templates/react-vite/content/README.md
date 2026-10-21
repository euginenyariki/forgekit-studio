# {{projectName}}

{{description}}

Generated with ForgeKit Studio.

## Getting started

```bash
{{installCommand}}
{{runCommand}} dev
```

The dev server listens on http://localhost:{{port}}.

| Command                    | What it does                                    |
| -------------------------- | ----------------------------------------------- |
| `{{runCommand}} dev`       | Start the Vite dev server with hot reload       |
| `{{runCommand}} build`     | Typecheck and build for production into `dist/` |
| `{{runCommand}} preview`   | Serve the production build locally              |
| `{{runCommand}} typecheck` | Run TypeScript without emitting files           |

## Project structure

```
.
├── index.html          Vite entry document
├── src
│   ├── App.tsx         Application shell
│   ├── components      UI components
│   ├── lib             Small utilities (fetch helper)
│   ├── index.css       Tailwind CSS entry and design tokens
│   └── main.tsx        React root
├── tsconfig.json
└── vite.config.ts      Dev server port {{port}}, React and Tailwind plugins
```

## Talking to an API

`src/lib/api.ts` reads `VITE_API_URL`. Create a `.env` file next to `package.json`:

```
VITE_API_URL=http://localhost:4000
```

Vite only exposes variables prefixed with `VITE_` to the browser, so keep secrets out of this file.
