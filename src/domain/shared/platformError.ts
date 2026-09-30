/**
 * Why a call to the platform failed: reading or writing stored data, reading the keyboard layout,
 * or changing a window. `storage`, `database`, `keymap` and `window` come from the Rust side (its
 * `ErrorKind`), `ipc` means
 * the call itself failed, `invalidResponse` that the answer didn't decode, and `notLoaded` that a
 * change needed the stored data before it was loaded. The message is for logs; the UI decides by
 * the kind.
 */
export type PlatformError = {
  readonly kind:
    'storage' | 'database' | 'keymap' | 'window' | 'ipc' | 'invalidResponse' | 'notLoaded';
  readonly message: string;
};
