import { invoke } from '@tauri-apps/api/core';

import type { ProgressRepository } from '@/domain/progress/repository';
import type { SettingsRepository } from '@/domain/settings/repository';

import { progressRepository } from './progress';
import { settingsRepository } from './settings';

/** Every repository the stores need. */
export type Repositories = {
  readonly settings: SettingsRepository;
  readonly progress: ProgressRepository;
};

/**
 * The repositories backed by the Rust side. The only place that hands Tauri's real `invoke` to
 * them, called once at startup.
 */
export function tauriRepositories(): Repositories {
  return { settings: settingsRepository(invoke), progress: progressRepository(invoke) };
}
