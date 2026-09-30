// The dependencies main.ts provides to the app, each under a typed injection key, and what's
// injected when one wasn't provided. Tests provide their own.

import type { InjectionKey } from 'vue';

import type { CurrentLayout } from '@/domain/keyboard/keymap';
import type { KeyLabels } from '@/domain/keyboard/labels';
import type { ProgressRepository } from '@/domain/progress/repository';
import type { SettingsRepository } from '@/domain/settings/repository';
import type { PlatformError } from '@/domain/shared/platformError';
import type { Result } from '@/domain/shared/result';
import type { Err } from '@/domain/shared/result';
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
  /**
   * Calls `listener` whenever the main window should open its options, until the returned
   * function stops it.
   */
  readonly onOptionsRequested: (listener: () => void) => () => void;
};

/** Where the app provides the window coordinator to the windows. */
export const windowsKey: InjectionKey<Windows> = Symbol('windows');

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
  saveSet: unavailable,
  recordReview: unavailable,
  replace: unavailable,
  reset: unavailable,
};

/** What a store injects when the app provided no keymap source: loading fails, nothing changes. */
export const missingKeymapSource: KeymapSource = { load: unavailable, onChange: () => ignore };

/** What a window injects when the app provided no window coordinator: nothing happens. */
export const missingWindows: Windows = {
  dismissPopover: unavailable,
  onOptionsRequested: () => ignore,
};

function ignore(): void {
  // Nothing to stop: a missing port never reports anything.
}
