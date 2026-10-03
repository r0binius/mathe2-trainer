import type { UsageRepository } from '@/domain/usage/repository';
import { decodeUsageCounts } from '@/domain/usage/usageCount';

import type { Invoke } from './ipc';
import { commandCaller, nothing } from './ipc';

/** The uses of shortcuts, counted by the Rust side in its database. */
export function usageRepository(invoke: Invoke): UsageRepository {
  const call = commandCaller(invoke);

  return {
    load: (layout, since) => call('load_usage', decodeUsageCounts, { layout, since }),
    recordUse: (shortcutUse) => call('record_use', nothing, { shortcutUse }),
  };
}
