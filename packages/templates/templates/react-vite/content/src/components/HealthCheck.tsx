import { useState } from 'react';

import { fetchJson } from '../lib/api.ts';

type Status =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'ok'; body: string }
  | { state: 'error'; message: string };

/**
 * Calls `GET /api/health` on the API configured through `VITE_API_URL`.
 *
 * Without `VITE_API_URL` the request goes to the current origin, which is the
 * right default when the app is served behind the same reverse proxy as its API.
 */
export function HealthCheck() {
  const [status, setStatus] = useState<Status>({ state: 'idle' });

  async function check() {
    setStatus({ state: 'loading' });
    try {
      const payload = await fetchJson<{ status?: string }>('/api/health');
      setStatus({ state: 'ok', body: JSON.stringify(payload) });
    } catch (error) {
      setStatus({
        state: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return (
    <section className="rounded-xl border border-line bg-panel p-6">
      <h2 className="text-lg font-semibold text-ink">API integration</h2>
      <p className="mt-1 text-sm text-muted">
        Set <code className="text-brand">VITE_API_URL</code> in a local <code>.env</code> file to
        point this request at your backend.
      </p>
      <button
        type="button"
        onClick={check}
        disabled={status.state === 'loading'}
        className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {status.state === 'loading' ? 'Checking…' : 'Check /api/health'}
      </button>
      {status.state === 'ok' && <p className="mt-3 font-mono text-xs text-ink">{status.body}</p>}
      {status.state === 'error' && (
        <p className="mt-3 font-mono text-xs text-red-500">{status.message}</p>
      )}
    </section>
  );
}
