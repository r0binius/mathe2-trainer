import { decodeCurrentLayout } from '@/domain/keyboard/keymap';
import type { PlatformError } from '@/domain/shared/platformError';
import type { Result } from '@/domain/shared/result';
import { err, ok } from '@/domain/shared/result';
import type { KeymapSource, Logger } from '@/ports';

import type { Invoke, Listen } from './ipc';
import { commandCaller } from './ipc';

/** The event the Rust side emits when the layout may have changed. */
const keymapChanged = 'keymap-changed';

/**
 * The keyboard layout selected in the system, read by the Rust side. If listening for changes
 * fails, the layout stays as it was read, and `logger` says why.
 */
export function keymapSource(invoke: Invoke, listen: Listen, logger: Logger): KeymapSource {
  const call = commandCaller(invoke);

  return {
    load: () => call('get_keymap', decodeCurrentLayout),
    onChange: (listener) => {
      const listening = startListening(listen, listener, logger);

      return () => {
        void listening.then(stopListening);
      };
    },
  };
}

/**
 * Listens for layout changes. Never rejects, as `ipc.ts`: a failed `listen` is a result, logged
 * where it happens.
 */
function startListening(
  listen: Listen,
  listener: () => void,
  logger: Logger,
): Promise<Result<() => void, PlatformError>> {
  return listen(keymapChanged, listener).then(ok, (error: unknown) => {
    const failed: PlatformError = { kind: 'ipc', message: String(error) };
    logger.error(`Could not follow keyboard layout changes: ${failed.message}`);
    return err(failed);
  });
}

/** Stops listening, if listening started. */
function stopListening(listened: Result<() => void, PlatformError>): void {
  switch (listened.kind) {
    case 'ok':
      listened.value();
      return;
    case 'err':
      return;
  }
}
