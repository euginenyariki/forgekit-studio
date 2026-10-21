import { useCallback, useEffect, useState } from 'react';

import { createItem, deleteItem, listItems, setItemDone, type Item } from '../lib/items.ts';

/**
 * Loads items from the API and mutates them through it.
 *
 * Errors are surfaced inline so the demo stays usable when the API is down.
 */
export function ItemBoard() {
  const [items, setItems] = useState<Item[]>([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setItems(await listItems());
      setStatus('ready');
      setError(null);
    } catch (cause) {
      setStatus('error');
      setError(cause instanceof Error ? cause.message : 'Failed to load items');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-line bg-panel p-6">
      <h2 className="text-lg font-semibold text-ink">Items from the API</h2>
      <p className="mt-1 text-sm text-muted">
        These records live in the Express app in <code>apps/api</code> and are fetched through the
        Vite dev proxy.
      </p>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const name = draft.trim();
          if (name.length === 0) return;
          void run(async () => {
            await createItem(name);
            setDraft('');
          });
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="New item name"
          maxLength={80}
          className="flex-1 rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={busy || draft.trim().length === 0}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Add
        </button>
      </form>

      {status === 'loading' && <p className="mt-4 text-sm text-muted">Loading…</p>}

      {status === 'error' && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          <p>{error}</p>
          <button type="button" onClick={() => void refresh()} className="mt-2 underline">
            Retry
          </button>
        </div>
      )}

      {status === 'ready' && items.length === 0 && (
        <p className="mt-4 text-sm text-muted">No items yet. Add the first one above.</p>
      )}

      <ul className="mt-4 divide-y divide-line">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              checked={item.done}
              disabled={busy}
              onChange={() => void run(async () => setItemDone(item, !item.done))}
              className="h-4 w-4 accent-[var(--fk-brand)]"
            />
            <span
              className={
                item.done ? 'flex-1 text-sm text-muted line-through' : 'flex-1 text-sm text-ink'
              }
            >
              {item.name}
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(async () => deleteItem(item.id))}
              className="text-xs text-muted underline hover:text-ink"
            >
              delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
