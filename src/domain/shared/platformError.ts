/**
 * Why a call to the platform failed: reading or writing stored data, reading the keyboard layout,
 * setting up the trigger, looking up another app's menus, watching how the user works or changing
 * a window. `storage`, `database`, `keymap`, `trigger`, `lookup`, `coach` and `window` come from
 * the Rust side (its `ErrorKind`), `ipc` means the call itself failed,
 * `invalidResponse` that the answer didn't decode, and `notLoaded` that a change needed the stored
 * data before it was loaded. The message is for logs; the UI decides by the kind.
 */
export type PlatformError = {
  readonly kind:
    | 'storage'
    | 'database'
    | 'keymap'
    | 'trigger'
    | 'lookup'
    | 'coach'
    | 'window'
    | 'ipc'
    | 'invalidResponse'
    | 'notLoaded';
  readonly message: string;
};
