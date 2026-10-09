import type { Progress } from '@/domain/progress/progress';
import { decodeProgress, newerOf, noProgress } from '@/domain/progress/progress';

/** Where the progress is kept between visits. Saving never throws: a failed save is reported. */
export type ProgressRepository = {
  readonly load: () => Promise<Progress>;
  /** Whether the progress was saved. */
  readonly save: (progress: Progress) => Promise<boolean>;
  /** What the repository is, for the settings: this browser, or the account too. */
  readonly describe: () => 'browser' | 'account';
};

const storageKey = 'mathe2-trainer/progress';

function parse(json: string | null): Progress {
  if (json === null) {
    return noProgress;
  }

  try {
    const decoded = decodeProgress(JSON.parse(json));

    return decoded.kind === 'ok' ? decoded.value : noProgress;
  } catch {
    return noProgress;
  }
}

function readLocal(): Progress {
  try {
    return parse(window.localStorage.getItem(storageKey));
  } catch {
    return noProgress;
  }
}

function writeLocal(progress: Progress): boolean {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(progress));

    return true;
  } catch {
    return false;
  }
}

/** A document of the artifact's database, as far as the trainer uses it. */
type CloudDocument = {
  readonly get: () => Promise<{
    readonly exists: boolean;
    readonly data: () => Readonly<Record<string, unknown>> | undefined;
  }>;
  readonly set: (data: Readonly<Record<string, unknown>>) => Promise<void>;
};

type Runtime = { readonly use: (name: string) => Promise<unknown> };

/**
 * The learner's own document in the published page's database, private to them, or `undefined`
 * where there is none: opened as a plain file, on a dev server, or signed out.
 */
async function cloudDocument(): Promise<CloudDocument | undefined> {
  const runtime = (window as unknown as { readonly claude?: Runtime }).claude;

  if (runtime === undefined) {
    return undefined;
  }

  try {
    const [db, user] = await Promise.all([runtime.use('db'), runtime.use('user')]);
    const id =
      user === null ? null : await (user as { readonly id: () => Promise<string | null> }).id();

    return db === null || id === null
      ? undefined
      : (
          db as {
            readonly collection: (path: string) => {
              readonly doc: (id: string) => CloudDocument;
            };
          }
        )
          .collection(`data/users/${id}`)
          .doc('progress');
  } catch {
    return undefined;
  }
}

const syncKeyKey = 'mathe2-trainer/sync-key';

/** The key that unlocks the synced progress on this device, or `''` if there is none. */
export function syncKey(): string {
  try {
    return window.localStorage.getItem(syncKeyKey) ?? '';
  } catch {
    return '';
  }
}

/** A new random sync key: anyone who knows it can read and replace the progress stored under it. */
export function newSyncKey(): string {
  const bytes = window.crypto.getRandomValues(new Uint8Array(32));

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Remembers the sync key on this device. Returns whether it was stored. */
export function setSyncKey(key: string): boolean {
  try {
    window.localStorage.setItem(syncKeyKey, key.trim());

    return true;
  } catch {
    return false;
  }
}

/**
 * The progress document on the server the page came from, or `undefined` while there is no sync
 * key. A missing document reads as one that does not exist; any other failure throws.
 */
function serverDocument(): CloudDocument | undefined {
  const key = syncKey();
  const headers = { Authorization: `Bearer ${key}` };

  return key === ''
    ? undefined
    : {
        get: async () => {
          const response = await fetch('/api/progress', { headers });

          if (response.status === 404) {
            return { exists: false, data: () => undefined };
          }

          if (!response.ok) {
            throw new Error(`Sync failed: ${String(response.status)}`);
          }

          const json = await response.text();

          return { exists: true, data: () => ({ json }) };
        },
        set: async (data) => {
          const json = data['json'];
          const response = await fetch('/api/progress', {
            method: 'PUT',
            headers,
            body: typeof json === 'string' ? json : '',
          });

          if (!response.ok) {
            throw new Error(`Sync failed: ${String(response.status)}`);
          }
        },
      };
}

/**
 * Keeps the progress in this browser, and, where the page runs as a published artifact, also in
 * the learner's private document there, or, with a sync key, on the server that serves the page,
 * so it follows them to another device. Loading takes the
 * newer of the two copies. The synced copy is stored as one JSON string.
 */
export function progressRepository(): ProgressRepository {
  const cloud = cloudDocument().then((document) => document ?? serverDocument());
  // eslint-disable-next-line functional/no-let -- remembers whether the account copy is reachable
  let synced = false;

  return {
    load: async () => {
      const local = readLocal();

      try {
        const snapshot = await (await cloud)?.get();
        const json = snapshot?.data()?.['json'];
        synced = snapshot !== undefined;

        return typeof json === 'string' ? newerOf(local, parse(json)) : local;
      } catch {
        return local;
      }
    },
    save: async (progress) => {
      const stored = writeLocal(progress);

      try {
        await (await cloud)?.set({ json: JSON.stringify(progress), updatedAt: progress.updatedAt });
      } catch {
        synced = false;
      }

      return stored || synced;
    },
    describe: () => (synced ? 'account' : 'browser'),
  };
}
