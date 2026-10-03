// The dependencies main.ts provides to the app, each under a typed injection key, and what's
// injected when one wasn't provided. Tests provide their own.

import type { InjectionKey } from 'vue';

import type { CurrentLayout } from '@/domain/keyboard/keymap';
import type { KeyLabels } from '@/domain/keyboard/labels';
import type { PopoverOpened } from '@/domain/lookup/appInFront';
import type { MenuGroup } from '@/domain/lookup/menuShortcuts';
import type { ProgressRepository } from '@/domain/progress/repository';
import type { CoachAccess, Permission } from '@/domain/settings/coachAccess';
import type { SettingsRepository } from '@/domain/settings/repository';
import type { PlatformError } from '@/domain/shared/platformError';
import type { Err, Result } from '@/domain/shared/result';
import { err } from '@/domain/shared/result';

/** Where the app provides the settings repository to the stores. */
export const settingsRepositoryKey: InjectionKey<SettingsRepository> =
  Symbol('settings repository');

/** Where the app provides the progress repository to the stores. */
export const progressRepositoryKey: InjectionKey<ProgressRepository> =
  Symbol('progress repository');

/**
 * Reads the keyboard layout in use from the system, and says when it may have changed. A shell
 * port like {@link Logger}: subscribing is an effect, which the domain has none of.
 */
export type KeymapSource = {
  readonly load: () => Promise<Result<CurrentLayout, PlatformError>>;
  /**
   * Calls `listener` whenever the user may have selected another layout, until the returned
   * function stops it. The layout may also be the same one.
   */
  readonly onChange: (listener: () => void) => () => void;
};

/** Where the app provides the source of the current keyboard layout to the stores. */
export const keymapSourceKey: InjectionKey<KeymapSource> = Symbol('keymap source');

/**
 * The window coordinator on the Rust side, which decides what the windows do. A shell port like
 * {@link KeymapSource}.
 */
export type Windows = {
  /** Closes the popover from inside it, giving focus back to the app it was opened over. */
  readonly dismissPopover: () => Promise<Result<void, PlatformError>>;
};

/** Where the app provides the window coordinator to the windows. */
export const windowsKey: InjectionKey<Windows> = Symbol('windows');

/**
 * Looking up the shortcuts of the app the user works in, from its menus. A shell port like
 * {@link Windows}.
 */
export type Lookup = {
  /**
   * Calls `listener` every time the popover opens, with the app it opens over, until the returned
   * function stops it.
   */
  readonly onPopoverOpened: (listener: (opened: PopoverOpened) => void) => () => void;
  /** Opens System Settings at Accessibility, where the user lets Mouseless read menus. */
  readonly askForMenuAccess: () => Promise<Result<void, PlatformError>>;
  /** The shortcuts in the menus of the app the popover opened over last, by menu. */
  readonly readMenuShortcuts: () => Promise<Result<readonly MenuGroup[], PlatformError>>;
};

/** Where the app provides the lookup to the popover. */
export const lookupKey: InjectionKey<Lookup> = Symbol('lookup');

/**
 * What learning from how the user works needs them to allow, and asking for it. A shell port like
 * {@link Windows}.
 */
export type CoachPermissions = {
  /**
   * Whether each permission is allowed. Once both are while the switch is on, the Rust side
   * starts watching.
   */
  readonly load: () => Promise<Result<CoachAccess, PlatformError>>;
  /** Opens System Settings where the user allows `permission`. */
  readonly askFor: (permission: Permission) => Promise<Result<void, PlatformError>>;
};

/** Where the app provides the coach's permissions to the Settings window. */
export const coachPermissionsKey: InjectionKey<CoachPermissions> = Symbol('coach permissions');

/**
 * What one window changed that the others show too, which the Rust side tells every window
 * about. Each function calls `listener` on every change, until the function it returns stops it.
 */
export type Changes = {
  /** The settings were saved, such as in the Settings window. */
  readonly onSettingsChanged: (listener: () => void) => () => void;
  /** All progress was reset. */
  readonly onProgressReset: (listener: () => void) => () => void;
};

/** Where the app provides the changes of other windows to the stores. */
export const changesKey: InjectionKey<Changes> = Symbol('changes');

/** Where the app provides the platform's key labels (⌘, ⌥, …) to the screens. */
export const keyLabelsKey: InjectionKey<KeyLabels> = Symbol('key labels');

/** What a screen injects when the app provided no key labels: keys show by their names. */
export const missingKeyLabels: KeyLabels = {};

/**
 * Where the app reports what went wrong, so it can be found later in an installed app. A shell
 * concern: the domain only returns errors.
 */
export type Logger = {
  readonly warn: (message: string) => void;
  readonly error: (message: string) => void;
};

/** Where the app provides its logger. */
export const loggerKey: InjectionKey<Logger> = Symbol('logger');

/** What's injected when the app provided no logger, as in tests: the console. */
export const consoleLogger: Logger = {
  warn: (message) => {
    console.warn(message);
  },
  error: (message) => {
    console.error(message);
  },
};

const notProvided: PlatformError = {
  kind: 'storage',
  message: 'no repository was provided to the app',
};

function unavailable(): Promise<Err<PlatformError>> {
  return Promise.resolve(err(notProvided));
}

/**
 * What a store injects when the app provided no settings repository: every call fails, so a
 * mistake in setting up the app shows as storage that isn't available instead of a crash.
 */
export const missingSettingsRepository: SettingsRepository = {
  load: unavailable,
  save: unavailable,
};

/** What a store injects when the app provided no progress repository: every call fails. */
export const missingProgressRepository: ProgressRepository = {
  load: unavailable,
  loadLog: unavailable,
  saveSet: unavailable,
  recordReview: unavailable,
  replace: unavailable,
  reset: unavailable,
};

/** What a store injects when the app provided no keymap source: loading fails, nothing changes. */
export const missingKeymapSource: KeymapSource = { load: unavailable, onChange: () => ignore };

/** What a window injects when the app provided no window coordinator: nothing happens. */
export const missingWindows: Windows = { dismissPopover: unavailable };

/** What the popover injects when the app provided no lookup: it never opens over an app. */
export const missingLookup: Lookup = {
  onPopoverOpened: () => ignore,
  askForMenuAccess: unavailable,
  readMenuShortcuts: unavailable,
};

/** What the Settings window injects when the app provided no coach permissions: unknown. */
export const missingCoachPermissions: CoachPermissions = { load: unavailable, askFor: unavailable };

/** What a store injects when the app provided no changes: no other window changes anything. */
export const missingChanges: Changes = {
  onSettingsChanged: () => ignore,
  onProgressReset: () => ignore,
};

function ignore(): void {
  // Nothing to stop: a missing port never reports anything.
}
