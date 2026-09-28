import type { ComputedRef } from 'vue';
import { onMounted, watch } from 'vue';

import type { SummaryContext } from '@/domain/progress/summary';
import { uiLanguageFor } from '@/domain/settings/language';
import type { Loadable } from '@/domain/shared/loadable';
import type { AppDefinition } from '@/domain/shortcuts/types';
import { useUiLanguage } from '@/i18n';
import { useKeymapStore } from '@/stores/keymap';
import { useProgressStore } from '@/stores/progress';
import { useSettingsStore } from '@/stores/settings';

import { useSummaryContext } from './useSummaryContext';

/**
 * Starts the main window: loads the settings, the layout and the progress (reconciled with
 * `apps`) once it's mounted, keeps the UI in the chosen language, and logs why loading failed.
 * Returns what the screens summarize progress with, once it's loaded.
 */
export function useStartup(apps: readonly AppDefinition[]): ComputedRef<Loadable<SummaryContext>> {
  const settings = useSettingsStore();
  const keymap = useKeymapStore();
  const progress = useProgressStore();
  const context = useSummaryContext();

  useUiLanguage(() =>
    settings.settings.status === 'loaded'
      ? uiLanguageFor(settings.settings.value.language, navigator.languages)
      : undefined,
  );

  onMounted(() => {
    void settings.load();
    void keymap.load();
    void progress.load(apps);
  });

  watch(context, (loaded) => {
    if (loaded.status === 'failed') {
      console.error(`Could not load: ${loaded.error.message}`);
    }
  });

  return context;
}
