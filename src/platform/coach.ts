import type { Permission } from '@/domain/settings/coachAccess';
import { decodeCoachAccess } from '@/domain/settings/coachAccess';
import type { CoachPermissions } from '@/ports';

import type { Invoke } from './ipc';
import { commandCaller, nothing } from './ipc';

/** The command that opens System Settings where the user allows each permission. */
const askCommands: Readonly<Record<Permission, string>> = {
  menus: 'ask_for_menu_access',
  input: 'ask_for_input_access',
};

/** What learning from how the user works needs them to allow, asked of the Rust side. */
export function coachPermissions(invoke: Invoke): CoachPermissions {
  const call = commandCaller(invoke);

  return {
    load: () => call('get_coach_access', decodeCoachAccess),
    askFor: (permission) => call(askCommands[permission], nothing),
  };
}
