import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

import type { ProgressRepository } from '@/domain/progress/repository';
import type { SettingsRepository } from '@/domain/settings/repository';
import type { KeymapSource, Windows } from '@/ports';

import { keymapSource } from './keymap';
import { tauriLogger } from './log';
import { progressRepository } from './progress';
import { settingsRepository } from './settings';
import { windows } from './windows';

/**
 * What the Rust side provides: the repositories and the keyboard layout to the stores, and the
 * window coordinator to the windows.
 */
export type Ports = {
  readonly settings: SettingsRepository;
  readonly progress: ProgressRepository;
  readonly keymap: KeymapSource;
  readonly windows: Windows;
};

/**
 * The ports backed by the Rust side. The only place that hands Tauri's real `invoke` and `listen`
 * to them, called once at startup.
 */
export function tauriPorts(): Ports {
  return {
    settings: settingsRepository(invoke),
    progress: progressRepository(invoke),
    keymap: keymapSource(invoke, listen, tauriLogger),
    windows: windows(invoke, listen, tauriLogger),
  };
}
