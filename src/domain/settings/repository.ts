import type { Result } from '../shared/result';
import type { StorageError } from '../shared/storage';
import type { Settings } from './settings';

/** Where the settings are kept. The shell passes an implementation in; tests pass their own. */
export type SettingsRepository = {
  readonly load: () => Promise<Result<Settings, StorageError>>;
  readonly save: (settings: Settings) => Promise<Result<void, StorageError>>;
};
