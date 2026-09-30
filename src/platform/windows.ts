import type { Logger, Windows } from '@/ports';

import type { Invoke, Listen } from './ipc';
import { commandCaller, nothing, subscriber } from './ipc';

/** The event the Rust side emits when the main window should open its options. */
const optionsRequested = 'options-requested';

/** The window coordinator on the Rust side. If listening fails, `logger` says why. */
export function windows(invoke: Invoke, listen: Listen, logger: Logger): Windows {
  const call = commandCaller(invoke);

  return {
    dismissPopover: () => call('dismiss_popover', nothing),
    onOptionsRequested: subscriber(listen, optionsRequested, (message) => {
      logger.error(`Could not follow requests for the options: ${message}`);
    }),
  };
}
