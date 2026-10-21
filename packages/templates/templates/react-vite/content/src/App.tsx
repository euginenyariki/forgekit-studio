import { useEffect, useState } from 'react';

import { Counter } from './components/Counter.tsx';
import { HealthCheck } from './components/HealthCheck.tsx';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'forgekit-theme';

function readStoredTheme(): Theme | null {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : null;
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme() ?? 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="text-xl font-semibold text-ink">{{ projectName }}</h1>
            <p className="mt-1 text-sm text-muted">{{ description }}</p>
          </div>
          <button
            type="button"
            onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
            className="rounded-lg border border-line px-3 py-2 text-sm text-ink hover:bg-canvas"
          >
            {theme === 'dark' ? 'Light theme' : 'Dark theme'}
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-3xl gap-6 px-4 py-8">
        <Counter />
        <HealthCheck />

        <section className="rounded-xl border border-line bg-panel p-6">
          <h2 className="text-lg font-semibold text-ink">Next steps</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>Edit src/App.tsx and watch the dev server reload.</li>
            <li>Add your own components under src/components.</li>
            <li>Run the build to typecheck and bundle for production.</li>
          </ul>
        </section>
      </main>

      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        Built with React, Vite and Tailwind CSS.
      </footer>
    </div>
  );
}
