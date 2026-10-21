import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <section className="rounded-xl border border-line bg-panel p-6">
      <h2 className="text-lg font-semibold text-ink">Interactive state</h2>
      <p className="mt-1 text-sm text-muted">
        React hooks are wired up and typed. Click to change state.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setCount((value) => value - 1)}
          className="h-9 w-9 rounded-lg border border-line text-ink hover:bg-canvas"
          aria-label="Decrease"
        >
          -
        </button>
        <output className="min-w-10 text-center font-mono text-xl text-brand">{count}</output>
        <button
          type="button"
          onClick={() => setCount((value) => value + 1)}
          className="h-9 w-9 rounded-lg border border-line text-ink hover:bg-canvas"
          aria-label="Increase"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => setCount(0)}
          className="ml-2 text-sm text-muted underline hover:text-ink"
        >
          reset
        </button>
      </div>
    </section>
  );
}
