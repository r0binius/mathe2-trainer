import type { Windows } from '@/ports';

import type { Invoke } from './ipc';
import { commandCaller, nothing } from './ipc';

/** The window coordinator on the Rust side. */
export function windows(invoke: Invoke): Windows {
  const call = commandCaller(invoke);

  return {
    dismissPopover: () => call('dismiss_popover', nothing),
  };
}
