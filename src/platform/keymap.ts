import { decodeCurrentLayout } from '@/domain/keyboard/keymap';
import type { KeymapSource, Logger } from '@/ports';

import type { Invoke, Listen } from './ipc';
import { commandCaller, subscriber } from './ipc';

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
    onChange: subscriber(listen, keymapChanged, (message) => {
      logger.error(`Could not follow keyboard layout changes: ${message}`);
    }),
  };
}
