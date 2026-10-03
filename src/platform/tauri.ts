import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

import type { ProgressRepository } from '@/domain/progress/repository';
import type { SettingsRepository } from '@/domain/settings/repository';
import type { UsageRepository } from '@/domain/usage/repository';
import type {
  Banners,
  Changes,
  Coach,
  CoachPermissions,
  KeymapSource,
  Lookup,
  Windows,
} from '@/ports';

import { changes } from './changes';
import { banners, coach, coachPermissions } from './coach';
import { keymapSource } from './keymap';
import { tauriLogger } from './log';
import { lookup } from './lookup';
import { progressRepository } from './progress';
import { settingsRepository } from './settings';
import { usageRepository } from './usage';
import { windows } from './windows';

/**
 * What the Rust side provides: the repositories, the keyboard layout and other windows' changes to
 * the stores, the window coordinator to the windows, the lookup to the popover, the coach's
 * permissions to the Settings window, the coach and the usage counts to the main window, and the
 * banners to the banner window.
 */
export type Ports = {
  readonly settings: SettingsRepository;
  readonly progress: ProgressRepository;
  readonly keymap: KeymapSource;
  readonly windows: Windows;
  readonly changes: Changes;
  readonly lookup: Lookup;
  readonly coachPermissions: CoachPermissions;
  readonly coach: Coach;
  readonly banners: Banners;
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
    coachPermissions: coachPermissions(invoke),
    coach: coach(invoke, listen, tauriLogger),
    banners: banners(listen, tauriLogger),
    usage: usageRepository(invoke),
  };
}
