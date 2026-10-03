import type { UsageRepository } from '@/domain/usage/repository';

import type { Invoke } from './ipc';
import { commandCaller, nothing } from './ipc';

/** The uses of shortcuts, counted by the Rust side in its database. */
export function usageRepository(invoke: Invoke): UsageRepository {
  const call = commandCaller(invoke);

  return {
    recordMenuUse: (menuUse) => call('record_menu_use', nothing, { menuUse }),
  };
}
