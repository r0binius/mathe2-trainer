/**
 * Why reading or writing stored data failed. `storage` and `database` come from the Rust side (its
 * `ErrorKind`), `ipc` means the call itself failed, and `invalidResponse` that the answer didn't
 * decode. The message is for logs; the UI decides by the kind.
 */
export type StorageError = {
  readonly kind: 'storage' | 'database' | 'ipc' | 'invalidResponse';
  readonly message: string;
};
