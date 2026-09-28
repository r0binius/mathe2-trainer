import type { Result } from './result';
import type { StorageError } from './storage';

/**
 * Data a store loads from storage, in one of its states, as Elm's `RemoteData`. The UI switches on
 * `status`, so it can't show data that isn't there or miss that loading failed.
 */
export type Loadable<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'loaded'; readonly value: T }
  | { readonly status: 'failed'; readonly error: StorageError };

/** The state a load's result leads to. */
export function loadableOf<T>(result: Result<T, StorageError>): Loadable<T> {
  return result.kind === 'ok'
    ? { status: 'loaded', value: result.value }
    : { status: 'failed', error: result.error };
}
