/** The success arm of a {@link Result}, carrying the computed value. */
export type Ok<T> = {
  readonly kind: 'ok';
  readonly value: T;
};

/** The failure arm of a {@link Result}, carrying the reason it failed. */
export type Err<E> = {
  readonly kind: 'err';
  readonly error: E;
};

/**
 * The outcome of a domain operation that can fail.
 *
 * Domain code returns failures as values instead of throwing, so the caller has to narrow on
 * `kind` before it can reach the value, and the compiler checks that it does.
 */
export type Result<T, E> = Ok<T> | Err<E>;

/**
 * Wraps a value as a successful {@link Result}.
 *
 * It returns the narrow {@link Ok} arm, which is still assignable to any `Result<T, E>`.
 */
export function ok<T>(value: T): Ok<T> {
  return { kind: 'ok', value };
}

/**
 * Wraps a reason as a failed {@link Result}.
 *
 * It returns the narrow {@link Err} arm, which is still assignable to any `Result<T, E>`.
 */
export function err<E>(error: E): Err<E> {
  return { kind: 'err', error };
}
