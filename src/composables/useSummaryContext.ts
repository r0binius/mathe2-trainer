import type { ComputedRef } from 'vue';
import { computed, onScopeDispose, ref } from 'vue';

import { practicePolicy } from '@/domain/keyboard/policy';
import type { SummaryContext } from '@/domain/progress/summary';
import { endOfLocalDay } from '@/domain/scheduling/days';
import { reservedFor } from '@/domain/settings/settings';
import type { Loadable } from '@/domain/shared/loadable';
import { allLoaded, mapLoadable } from '@/domain/shared/loadable';
import { localTimeAt } from '@/localTime';
import { useKeymapStore } from '@/stores/keymap';
import { useProgressStore } from '@/stores/progress';
import { useSettingsStore } from '@/stores/settings';

/**
 * What the screens summarize progress with, once the settings, the layout and the progress are
 * loaded. The app keeps running for days, so the end of today moves on whenever the window gains
 * focus.
 */
export function useSummaryContext(): ComputedRef<Loadable<SummaryContext>> {
  const settings = useSettingsStore();
  const keymap = useKeymapStore();
  const progress = useProgressStore();
  const endOfToday = ref(endOfTodayNow());

  function refresh(): void {
    endOfToday.value = endOfTodayNow();
  }

  window.addEventListener('focus', refresh);
  onScopeDispose(() => {
    window.removeEventListener('focus', refresh);
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
        endOfToday: endOfToday.value,
      }),
    ),
  );
}

function endOfTodayNow(): number {
  return endOfLocalDay(localTimeAt(Date.now()));
}
