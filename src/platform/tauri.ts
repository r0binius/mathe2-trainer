import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

import type { ProgressRepository } from '@/domain/progress/repository';
import type { SettingsRepository } from '@/domain/settings/repository';
import type { KeymapSource } from '@/ports';

import { keymapSource } from './keymap';
import { progressRepository } from './progress';
import { settingsRepository } from './settings';

/** Every repository the stores need, and the source of the keyboard layout. */
export type Repositories = {
  readonly settings: SettingsRepository;
  readonly progress: ProgressRepository;
  readonly keymap: KeymapSource;
};

/**
 * The repositories backed by the Rust side. The only place that hands Tauri's real `invoke` and
 * `listen` to them, called once at startup.
 */
export function tauriRepositories(): Repositories {
  return {
    settings: settingsRepository(invoke),
    progress: progressRepository(invoke),
    keymap: keymapSource(invoke, listen),
  };
}
