import { defineStore } from 'pinia';
import { computed, inject, onScopeDispose, shallowRef } from 'vue';

import type { Settings } from '@/domain/settings/settings';
import type { Loadable } from '@/domain/shared/loadable';
import { loadableOf } from '@/domain/shared/loadable';
import type { PlatformError } from '@/domain/shared/platformError';
import type { Result } from '@/domain/shared/result';
import {
  changesKey,
  missingChanges,
  missingSettingsRepository,
  settingsRepositoryKey,
} from '@/ports';

/**
 * The user's settings, loaded at startup, changed only once they're saved, and loaded again when
 * another window saved them.
 */
export const useSettingsStore = defineStore('settings', () => {
  const repository = inject(settingsRepositoryKey, missingSettingsRepository);
  const settings = shallowRef<Loadable<Settings>>({ status: 'loading' });
  /** The settings once they're loaded, for the many places that only read one of them. */
  const current = computed(() =>
    settings.value.status === 'loaded' ? settings.value.value : undefined,
  );

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

  onScopeDispose(
    inject(changesKey, missingChanges).onSettingsChanged(() => {
      void load();
    }),
  );

  return { settings, current, load, save };
});
