import type { ComputedRef } from 'vue';
import { computed } from 'vue';

import { practicePolicy } from '@/domain/keyboard/policy';
import type { SummaryContext } from '@/domain/progress/summary';
import { endOfLocalDay } from '@/domain/scheduling/days';
import { reservedFor } from '@/domain/settings/settings';
import type { Loadable } from '@/domain/shared/loadable';
import { allLoaded, mapLoadable } from '@/domain/shared/loadable';
import { useKeymapStore } from '@/stores/keymap';
import { useProgressStore } from '@/stores/progress';
import { useSettingsStore } from '@/stores/settings';

/**
 * What the screens summarize progress with, once the settings, the layout and the progress are
 * loaded. Today ends where it did when the context was created.
 */
export function useSummaryContext(): ComputedRef<Loadable<SummaryContext>> {
  const settings = useSettingsStore();
  const keymap = useKeymapStore();
  const progress = useProgressStore();
  const now = new Date();
  const endOfToday = endOfLocalDay({
    at: now.getTime(),
    utcOffsetMinutes: -now.getTimezoneOffset(),
  });

  return computed(() =>
    mapLoadable(
      allLoaded({
        settings: settings.settings,
        layout: keymap.layout,
        stored: progress.progress,
      }),
      ({ settings: { trigger }, layout, stored }) => ({
        keymap: layout.keymap,
        layout: layout.id,
        policy: practicePolicy(reservedFor(trigger)),
        progress: stored,
        endOfToday,
      }),
    ),
  );
}
