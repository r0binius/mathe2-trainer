import { decodePopoverOpened } from '@/domain/lookup/appInFront';
import { decodeMenuGroups } from '@/domain/lookup/menuShortcuts';
import type { Logger, Lookup } from '@/ports';

import type { Invoke, Listen } from './ipc';
import { commandCaller, decodingPayloads, nothing, subscriber } from './ipc';

/** The event the Rust side sends the popover alone, every time it opens. */
const popoverOpened = 'popover-opened';

/**
 * Looking up the app in front, through the Rust side. If listening for the popover fails, or what
 * it says doesn't decode, `logger` says why.
 */
export function lookup(invoke: Invoke, listen: Listen, logger: Logger): Lookup {
  const call = commandCaller(invoke);

  function report(message: string): void {
    logger.error(`Could not follow ${popoverOpened}: ${message}`);
  }

  return {
    onPopoverOpened: decodingPayloads(
      subscriber(listen, popoverOpened, report),
      decodePopoverOpened,
      report,
    ),
    askForMenuAccess: () => call('ask_for_menu_access', nothing),
    readMenuShortcuts: () => call('read_menu_shortcuts', decodeMenuGroups),
  };
}
