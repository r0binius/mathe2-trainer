import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import { createApp } from 'vue';

import type { CurrentLayout, KeymapSource } from '@/domain/keyboard/keymap';
import { err, ok } from '@/domain/shared/result';

import { useKeymapStore } from './keymap';
import { keymapSourceKey } from './repositories';

const us: CurrentLayout = {
  id: 'com.apple.keylayout.US',
  keymap: { KeyA: { value: 'a', withShift: 'A', withAlt: 'å', withShiftAlt: 'Å' } },
};

/** The store in an app that provides `source`, or none. */
function storeWith(source?: KeymapSource) {
  const pinia = createPinia();
  const app = createApp({}).use(pinia);

  if (source !== undefined) {
    app.provide(keymapSourceKey, source);
  }

  return useKeymapStore(pinia);
}

describe('useKeymapStore', () => {
  it('is loading until it read the current layout', async () => {
    const store = storeWith({ load: () => Promise.resolve(ok(us)) });

    expect(store.layout).toStrictEqual({ status: 'loading' });
    await store.load();
    expect(store.layout).toStrictEqual({ status: 'loaded', value: us });
  });

  it('shows that reading the layout failed', async () => {
    const failed = { kind: 'ipc', message: 'no keyboard' } as const;
    const store = storeWith({ load: () => Promise.resolve(err(failed)) });

    await store.load();
    expect(store.layout).toStrictEqual({ status: 'failed', error: failed });
  });

  it('fails to load when the app provided no source', async () => {
    const store = storeWith();

    await store.load();
    expect(store.layout).toMatchObject({ status: 'failed', error: { kind: 'storage' } });
  });
});
