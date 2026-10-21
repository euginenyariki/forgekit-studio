const baseUrl = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Thrown by `fetchJson` with the parsed validation details from the API. */
export interface ApiValidationError {
  message: string;
  details?: { path: string; message: string }[];
}

async function readError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: ApiValidationError };
    if (payload.error?.message) {
      const details = payload.error.details?.map((issue) => issue.message).join('; ');
      return details ? `${payload.error.message}: ${details}` : payload.error.message;
    }
  } catch {
    // Fall through to the status text when the body is not JSON.
  }
  return `${response.status} ${response.statusText}`;
}

/** Fetch JSON through the dev proxy (or `VITE_API_URL` in production). */
export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Accept: 'application/json', ...init?.headers },
    ...init,
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readError(response));
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function postJson<T>(path: string, body: unknown): Promise<T> {
  return fetchJson<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function patchJson<T>(path: string, body: unknown): Promise<T> {
  return fetchJson<T>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function deleteRequest(path: string): Promise<void> {
  return fetchJson<void>(path, { method: 'DELETE' });
}
