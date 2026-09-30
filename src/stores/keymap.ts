import { defineStore } from 'pinia';
import { inject, onScopeDispose, shallowRef } from 'vue';

import type { CurrentLayout } from '@/domain/keyboard/keymap';
import { afterLayoutChange } from '@/domain/keyboard/keymap';
import type { Loadable } from '@/domain/shared/loadable';
import { loadableOf } from '@/domain/shared/loadable';
import { consoleLogger, keymapSourceKey, loggerKey, missingKeymapSource } from '@/ports';

/**
 * The keyboard layout in use, which decides how shortcuts are pressed and whose progress shows.
 * It follows the layout the user selects in the system.
 */
export const useKeymapStore = defineStore('keymap', () => {
  const source = inject(keymapSourceKey, missingKeymapSource);
  const logger = inject(loggerKey, consoleLogger);
  const layout = shallowRef<Loadable<CurrentLayout>>({ status: 'loading' });

  /** Loads the current layout. */
  async function load(): Promise<void> {
    layout.value = loadableOf(await source.load());
  }

  async function reload(): Promise<void> {
    const read = await source.load();

    if (read.kind === 'err' && layout.value.status === 'loaded') {
      logger.warn(
        `Could not read the new keyboard layout, keeping the old one: ${read.error.message}`,
      );
    }

    layout.value = afterLayoutChange(layout.value, read);
  }

  onScopeDispose(
    source.onChange(() => {
      void reload();
    }),
  );

  return { layout, load };
});
