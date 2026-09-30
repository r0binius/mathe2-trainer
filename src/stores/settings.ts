import { defineStore } from 'pinia';
import { inject, shallowRef } from 'vue';

import type { Settings } from '@/domain/settings/settings';
import type { Loadable } from '@/domain/shared/loadable';
import { loadableOf } from '@/domain/shared/loadable';
import type { PlatformError } from '@/domain/shared/platformError';
import type { Result } from '@/domain/shared/result';
import { missingSettingsRepository, settingsRepositoryKey } from '@/ports';

/** The user's settings, loaded once at startup and changed only once they're saved. */
export const useSettingsStore = defineStore('settings', () => {
  const repository = inject(settingsRepositoryKey, missingSettingsRepository);
  const settings = shallowRef<Loadable<Settings>>({ status: 'loading' });

  /** Loads the settings. */
  async function load(): Promise<void> {
    settings.value = loadableOf(await repository.load());
  }

  /** Saves the settings and shows them once they're stored. */
  async function save(changed: Settings): Promise<Result<void, PlatformError>> {
    const saved = await repository.save(changed);

    if (saved.kind === 'ok') {
      settings.value = { status: 'loaded', value: changed };
    }

    return saved;
  }

  return { settings, load, save };
});
