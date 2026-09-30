import { createPinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from 'vue';

import type { CurrentLayout } from '@/domain/keyboard/keymap';
import type { PlatformError } from '@/domain/shared/platformError';
import type { Result } from '@/domain/shared/result';
import { err, ok } from '@/domain/shared/result';
import type { KeymapSource, Logger } from '@/ports';
import { keymapSourceKey, loggerKey } from '@/ports';

import { useKeymapStore } from './keymap';

const us: CurrentLayout = {
  id: 'com.apple.keylayout.US',
  keymap: { KeyA: { value: 'a', withShift: 'A', withAlt: 'å', withShiftAlt: 'Å' } },
};

const german: CurrentLayout = { id: 'com.apple.keylayout.German', keymap: {} };

const failed = { kind: 'keymap', message: 'no keyboard layout is selected' } as const;

/** The store in an app that provides `source`, or none, and `logger`. */
function storeWith(source?: KeymapSource, logger: Logger = { warn: vi.fn(), error: vi.fn() }) {
  const pinia = createPinia();
  const app = createApp({}).use(pinia).provide(loggerKey, logger);

  if (source !== undefined) {
    app.provide(keymapSourceKey, source);
  }

  return app.runWithContext(() => useKeymapStore(pinia));
}

/** A source that reads `layouts` in turn and reports a change when `change` is called. */
function switchingSource(...layouts: readonly Result<CurrentLayout, PlatformError>[]) {
  const reads = layouts.values();
  const stop = vi.fn();
  const onChange = vi.fn<KeymapSource['onChange']>(() => stop);
  const source: KeymapSource = {
    load: () => Promise.resolve(reads.next().value ?? err(failed)),
    onChange,
  };

  function change(): void {
    onChange.mock.calls.forEach(([listener]) => {
      listener();
    });
  }

  return { source, change, stop };
}

/** Lets the reload that a change started finish. */
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

describe('useKeymapStore', () => {
  it('is loading until it read the current layout', async () => {
    const store = storeWith(switchingSource(ok(us)).source);

    expect(store.layout).toStrictEqual({ status: 'loading' });
    await store.load();
    expect(store.layout).toStrictEqual({ status: 'loaded', value: us });
  });

  it('shows that reading the layout failed', async () => {
    const store = storeWith(switchingSource(err(failed)).source);

    await store.load();
    expect(store.layout).toStrictEqual({ status: 'failed', error: failed });
  });

  it('fails to load when the app provided no source', async () => {
    const store = storeWith();

    await store.load();
    expect(store.layout).toMatchObject({ status: 'failed', error: { kind: 'storage' } });
  });

  it('reads the layout again when it changes', async () => {
    const { source, change } = switchingSource(ok(german), ok(us));
    const store = storeWith(source);

    await store.load();
    change();
    await settle();

    expect(store.layout).toStrictEqual({ status: 'loaded', value: us });
  });

  it('keeps the old layout and logs why when the new one fails to read', async () => {
    const { source, change } = switchingSource(ok(german), err(failed));
    const logger = { warn: vi.fn(), error: vi.fn() };
    const store = storeWith(source, logger);

    await store.load();
    change();
    await settle();

    expect(store.layout).toStrictEqual({ status: 'loaded', value: german });
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining(failed.message));
  });

  it('stops listening once the store is disposed', () => {
    const { source, stop } = switchingSource();
    const store = storeWith(source);

    expect(stop).not.toHaveBeenCalled();
    store.$dispose();
    expect(stop).toHaveBeenCalledOnce();
  });
});
