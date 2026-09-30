import type { KeymapSource } from '@/domain/keyboard/keymap';
import { decodeCurrentLayout } from '@/domain/keyboard/keymap';

import type { Invoke } from './ipc';
import { commandCaller } from './ipc';

/** The keyboard layout selected in the system, read by the Rust side. */
export function keymapSource(invoke: Invoke): KeymapSource {
  const call = commandCaller(invoke);

  return { load: () => call('get_keymap', decodeCurrentLayout) };
}
