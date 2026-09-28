import type { SettingsRepository } from '@/domain/settings/repository';
import { decodeSettings } from '@/domain/settings/settings';

import type { Invoke } from './ipc';
import { commandCaller, nothing } from './ipc';

/** The settings, kept by the Rust side in its database. */
export function settingsRepository(invoke: Invoke): SettingsRepository {
  const call = commandCaller(invoke);

  return {
    load: () => call('get_settings', decodeSettings),
    save: (settings) => call('set_settings', nothing, { settings }),
  };
}
