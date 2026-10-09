/** The part of a KV namespace the worker uses. */
type Store = {
  readonly get: (key: string) => Promise<string | null>;
  readonly put: (key: string, value: string) => Promise<void>;
};

type Env = {
  /** Serves the built page. */
  readonly ASSETS: { readonly fetch: (request: Request) => Promise<Response> };
  readonly PROGRESS: Store;
  /** The sync keys that may use the API, separated by commas. A secret. */
  readonly SYNC_KEYS: string;
};

/** The progress is a few kilobytes; this only keeps a stray request from filling the store. */
const sizeLimit = 1_000_000;

async function digest(text: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));

  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function bearer(request: Request): string {
  return request.headers.get('Authorization')?.replace(/^Bearer /u, '') ?? '';
}

async function progress(request: Request, env: Env): Promise<Response> {
  const key = bearer(request);
  const allowed = env.SYNC_KEYS.split(',').map((entry) => entry.trim());

  if (key === '' || !allowed.includes(key)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const slot = `progress:${await digest(key)}`;

  if (request.method === 'GET') {
    const json = await env.PROGRESS.get(slot);

    return json === null
      ? new Response(null, { status: 404 })
      : new Response(json, { headers: { 'Content-Type': 'application/json' } });
  }

  if (request.method === 'PUT') {
    const json = await request.text();

    if (json.length > sizeLimit) {
      return new Response('Too large', { status: 413 });
    }

    await env.PROGRESS.put(slot, json);

    return new Response(null, { status: 204 });
  }

  return new Response('Method not allowed', { status: 405 });
}

export default {
  fetch: (request: Request, env: Env): Promise<Response> =>
    new URL(request.url).pathname === '/api/progress'
      ? progress(request, env)
      : env.ASSETS.fetch(request),
};
