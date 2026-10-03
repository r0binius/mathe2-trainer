import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

import type { ProgressRepository } from '@/domain/progress/repository';
import type { SettingsRepository } from '@/domain/settings/repository';
import type { UsageRepository } from '@/domain/usage/repository';
import type { Changes, Coach, KeymapSource, Lookup, Windows } from '@/ports';

import { changes } from './changes';
import { coach } from './coach';
import { keymapSource } from './keymap';
import { tauriLogger } from './log';
import { lookup } from './lookup';
import { progressRepository } from './progress';
import { settingsRepository } from './settings';
import { usageRepository } from './usage';
import { windows } from './windows';

/**
 * What the Rust side provides: the repositories, the keyboard layout and other windows' changes to
 * the stores, the window coordinator to the windows, the lookup to the popover, the coach to the
 * Settings and main windows, and the usage counts to the main window.
 */
export type Ports = {
  readonly settings: SettingsRepository;
  readonly progress: ProgressRepository;
  readonly keymap: KeymapSource;
  readonly windows: Windows;
  readonly changes: Changes;
  readonly lookup: Lookup;
  readonly coach: Coach;
  readonly usage: UsageRepository;
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
    windows: windows(invoke),
    changes: changes(listen, tauriLogger),
    lookup: lookup(invoke, listen, tauriLogger),
    coach: coach(invoke, listen, tauriLogger),
    usage: usageRepository(invoke),
  };
}
