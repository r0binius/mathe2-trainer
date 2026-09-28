import { defineStore } from 'pinia';
import { inject, shallowRef } from 'vue';

import type { CurrentLayout } from '@/domain/keyboard/keymap';
import type { Loadable } from '@/domain/shared/loadable';
import { loadableOf } from '@/domain/shared/loadable';
import { keymapSourceKey, missingKeymapSource } from '@/ports';

/** The keyboard layout in use, which decides how shortcuts are pressed and whose progress shows. */
export const useKeymapStore = defineStore('keymap', () => {
  const source = inject(keymapSourceKey, missingKeymapSource);
  const layout = shallowRef<Loadable<CurrentLayout>>({ status: 'loading' });

  /** Loads the current layout. */
  async function load(): Promise<void> {
    layout.value = loadableOf(await source.load());
  }

  return { layout, load };
});
