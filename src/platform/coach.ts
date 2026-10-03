import type { Permission } from '@/domain/settings/coachAccess';
import { decodeCoachAccess } from '@/domain/settings/coachAccess';
import { decodeMenuChoice } from '@/domain/usage/menuChoice';
import type { Coach, Logger } from '@/ports';

import type { Invoke, Listen } from './ipc';
import { commandCaller, decodingPayloads, nothing, subscriber } from './ipc';

/** The command that opens System Settings where the user allows each permission. */
const askCommands: Readonly<Record<Permission, string>> = {
  menus: 'ask_for_menu_access',
  input: 'ask_for_input_access',
};

/** The event the Rust side sends the main window for every menu choice it sees. */
const menuChosen = 'menu-chosen';

/**
 * The coach on the Rust side. If listening for menu choices fails, or one doesn't decode,
 * `logger` says why.
 */
export function coach(invoke: Invoke, listen: Listen, logger: Logger): Coach {
  const call = commandCaller(invoke);

  function report(message: string): void {
    logger.error(`Could not follow ${menuChosen}: ${message}`);
  }

  return {
    load: () => call('get_coach_access', decodeCoachAccess),
    askFor: (permission) => call(askCommands[permission], nothing),
    onMenuChosen: decodingPayloads(
      subscriber(listen, menuChosen, report),
      decodeMenuChoice,
      report,
    ),
  };
}
