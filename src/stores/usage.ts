import { defineStore } from 'pinia';
import { inject, onScopeDispose, shallowRef } from 'vue';

import type { LayoutId } from '@/domain/keyboard/keymap';
import type { Loadable } from '@/domain/shared/loadable';
import { loadableOf, mapLoadable } from '@/domain/shared/loadable';
import type { PlatformError } from '@/domain/shared/platformError';
import type { Result } from '@/domain/shared/result';
import type { ShortcutUse } from '@/domain/usage/repository';
import type { UsageCount } from '@/domain/usage/usageCount';
import { usageSince, withUse } from '@/domain/usage/usageCount';
import { changesKey, missingChanges, missingUsageRepository, usageRepositoryKey } from '@/ports';

/** The counts of one layout, as the store keeps them. */
export type LayoutUsage = {
  readonly layout: LayoutId;
  readonly counts: readonly UsageCount[];
};

/**
 * How shortcuts were used on the current layout over the last days, while learning from work is
 * on: by their keys and from menus. A use is counted, then shown.
 */
export const useUsageStore = defineStore('usage', () => {
  const repository = inject(usageRepositoryKey, missingUsageRepository);
  const usage = shallowRef<Loadable<LayoutUsage>>({ status: 'loading' });
  /** The layout whose counts were asked for last, so the counts of an earlier one are dropped. */
  const asked = shallowRef<LayoutId>();

  /** Loads the counts of `layout` from {@link usageSince} `today` on. */
  async function load(layout: LayoutId, today: number): Promise<void> {
    asked.value = layout;
    const loaded = await repository.load(layout, usageSince(today));

    if (asked.value === layout) {
      usage.value = mapLoadable(loadableOf(loaded), (counts) => ({ layout, counts }));
    }
  }

  /** Counts a use and, once it's stored, adds it to the counts shown of its layout. */
  async function record(shortcutUse: ShortcutUse): Promise<Result<void, PlatformError>> {
    const recorded = await repository.recordUse(shortcutUse);

    if (
      recorded.kind === 'ok' &&
      usage.value.status === 'loaded' &&
      usage.value.value.layout === shortcutUse.layout
    ) {
      const { layout, counts } = usage.value.value;
      usage.value = { status: 'loaded', value: { layout, counts: withUse(counts, shortcutUse) } };
    }

    return recorded;
  }

  // A reset deletes the counts along with the progress.
  onScopeDispose(
    inject(changesKey, missingChanges).onProgressReset(() => {
      usage.value = mapLoadable(usage.value, ({ layout }) => ({ layout, counts: [] }));
    }),
  );

  return { usage, load, record };
});
