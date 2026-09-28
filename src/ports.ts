// The dependencies main.ts provides to the app, each under a typed injection key, and what's
// injected when one wasn't provided. Tests provide their own.

import type { InjectionKey } from 'vue';

import type { KeymapSource } from '@/domain/keyboard/keymap';
import type { ProgressRepository } from '@/domain/progress/repository';
import type { SettingsRepository } from '@/domain/settings/repository';
import type { Err } from '@/domain/shared/result';
import { err } from '@/domain/shared/result';
import type { StorageError } from '@/domain/shared/storage';

/** Where the app provides the settings repository to the stores. */
export const settingsRepositoryKey: InjectionKey<SettingsRepository> =
  Symbol('settings repository');

/** Where the app provides the progress repository to the stores. */
export const progressRepositoryKey: InjectionKey<ProgressRepository> =
  Symbol('progress repository');

/** Where the app provides the source of the current keyboard layout to the stores. */
export const keymapSourceKey: InjectionKey<KeymapSource> = Symbol('keymap source');

const notProvided: StorageError = {
  kind: 'storage',
  message: 'no repository was provided to the app',
};

function unavailable(): Promise<Err<StorageError>> {
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

/** What a store injects when the app provided no keymap source: loading fails. */
export const missingKeymapSource: KeymapSource = { load: unavailable };
