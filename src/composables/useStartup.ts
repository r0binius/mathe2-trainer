import type { ComputedRef } from 'vue';
import { computed, inject, onMounted, watch } from 'vue';

import type { LayoutId } from '@/domain/keyboard/keymap';
import type { SummaryContext } from '@/domain/progress/summary';
import { localDay } from '@/domain/scheduling/days';
import type { Loadable } from '@/domain/shared/loadable';
import type { AppDefinition } from '@/domain/shortcuts/types';
import { localTimeAt } from '@/localTime';
import { consoleLogger, loggerKey } from '@/ports';
import { useKeymapStore } from '@/stores/keymap';
import { useProgressStore } from '@/stores/progress';
import { useSettingsStore } from '@/stores/settings';
import { useUsageStore } from '@/stores/usage';

import { useSettingsLanguage } from './useSettingsLanguage';
import { useSummaryContext } from './useSummaryContext';

/**
 * Starts the main window: loads the settings, the layout and the progress (reconciled with
 * `apps`) once it's mounted, and the review log and usage counts of each layout in use, keeps the
 * UI in the chosen language, and logs why loading failed.
 * Returns what the screens summarize progress with, once it's loaded, and how to load again
 * after a failure.
 */
export function useStartup(
  apps: readonly AppDefinition[],
): readonly [context: ComputedRef<Loadable<SummaryContext>>, retry: () => void] {
  const settings = useSettingsStore();
  const keymap = useKeymapStore();
  const progress = useProgressStore();
  const usage = useUsageStore();
  const context = useSummaryContext();
  const logger = inject(loggerKey, consoleLogger);
  const layoutId = computed(() =>
    keymap.layout.status === 'loaded' ? keymap.layout.value.id : undefined,
  );
  const learning = computed(() => settings.current?.learnFromWork === true);

  useSettingsLanguage();

  function loadLog(layout: LayoutId | undefined): void {
    if (layout !== undefined) {
      void progress.loadLog(layout, localTimeAt(Date.now()));
    }
  }

  /** Loads the usage counts of the layout; turning learning from work off deletes them. */
  function loadUsage(): void {
    if (layoutId.value !== undefined) {
      void usage.load(layoutId.value, localDay(localTimeAt(Date.now())));
    }
  }

  function load(): void {
    void settings.load();
    void keymap.load();
    void progress.load(apps);
    loadLog(layoutId.value);
    loadUsage();
  }

  onMounted(load);
  watch(layoutId, loadLog);
  watch([layoutId, learning], loadUsage);

  watch(context, (loaded) => {
    if (loaded.status === 'failed') {
      logger.error(`Could not load: ${loaded.error.message}`);
    }
  });

  return [context, load];
}
