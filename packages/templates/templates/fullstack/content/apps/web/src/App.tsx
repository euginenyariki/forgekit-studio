import { ItemBoard } from './components/ItemBoard.tsx';

export default function App() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-panel">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <p className="text-xs font-medium uppercase tracking-wider text-brand">ForgeKit</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">{{ projectName }}</h1>
          <p className="mt-2 text-sm text-muted">{{ description }}</p>
        </div>
      </header>

      <main className="mx-auto grid max-w-3xl gap-6 px-4 py-8">
        <ItemBoard />
      </main>

      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        React, Vite and Tailwind on the front, Express and Zod on the back.
      </footer>
    </div>
  );
}
