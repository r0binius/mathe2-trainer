import type { PlatformError } from '../shared/platformError';
import type { Result } from '../shared/result';
import type { Settings } from './settings';

/** Where the settings are kept. The shell passes an implementation in; tests pass their own. */
export type SettingsRepository = {
  readonly load: () => Promise<Result<Settings, PlatformError>>;
  readonly save: (settings: Settings) => Promise<Result<void, PlatformError>>;
};
