import { decodeCurrentLayout } from '@/domain/keyboard/keymap';
import type { KeymapSource } from '@/ports';

import type { Invoke, Listen } from './ipc';
import { commandCaller } from './ipc';

/** The event the Rust side emits when the layout may have changed. */
const keymapChanged = 'keymap-changed';

/** The keyboard layout selected in the system, read by the Rust side. */
export function keymapSource(invoke: Invoke, listen: Listen): KeymapSource {
  const call = commandCaller(invoke);

  return {
    load: () => call('get_keymap', decodeCurrentLayout),
    onChange: (listener) => {
      const listening = listen(keymapChanged, listener);

      return () => {
        void listening.then((unlisten) => {
          unlisten();
        });
      };
    },
  };
}
