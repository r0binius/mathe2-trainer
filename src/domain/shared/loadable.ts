import type { PlatformError } from './platformError';
import type { Result } from './result';

/**
 * Data a store loads from storage, in one of its states, as Elm's `RemoteData`. The UI switches on
 * `status`, so it can't show data that isn't there or miss that loading failed.
 */
export type Loadable<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'loaded'; readonly value: T }
  | { readonly status: 'failed'; readonly error: PlatformError };

/** The state a load's result leads to. */
export function loadableOf<T>(result: Result<T, PlatformError>): Loadable<T> {
  return result.kind === 'ok'
    ? { status: 'loaded', value: result.value }
    : { status: 'failed', error: result.error };
}

/** Transforms the value once it's loaded; loading and failed stay as they are. */
export function mapLoadable<T, U>(loadable: Loadable<T>, transform: (value: T) => U): Loadable<U> {
  return loadable.status === 'loaded'
    ? { status: 'loaded', value: transform(loadable.value) }
    : loadable;
}

/**
 * Several loadables as one: loaded once all are, with their values under the same names, and
 * failed as soon as one fails, since the others are of no use without it.
 */
export function allLoaded<T extends Readonly<Record<string, unknown>>>(loadables: {
  readonly [K in keyof T]: Loadable<T[K]>;
}): Loadable<T> {
  const states: readonly Loadable<unknown>[] = Object.values(loadables);
  const failed = states.find((state) => state.status === 'failed');

  if (failed !== undefined) {
    return failed;
  }

  if (states.some((state) => state.status === 'loading')) {
    return { status: 'loading' };
  }

  // The cast is what the checks establish: every entry is loaded, so each value sits under its
  // own name, as `T` says.
  return {
    status: 'loaded',
    value: Object.fromEntries(Object.entries(loadables).map(valueOf)) as T,
  };
}

function valueOf([name, state]: readonly [string, Loadable<unknown>]): readonly [string, unknown] {
  return [name, state.status === 'loaded' ? state.value : undefined];
}
