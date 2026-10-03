import { createPinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from 'vue';

import { err, ok } from '@/domain/shared/result';
import type { UsageRepository } from '@/domain/usage/repository';
import type { Changes } from '@/ports';
import { changesKey, missingChanges, usageRepositoryKey } from '@/ports';

import { useUsageStore } from './usage';

const german = 'com.apple.keylayout.German';
const us = 'com.apple.keylayout.US';
const count = { id: 'notes/Meta+n', day: 20_029, byKeys: 2, byMenu: 1 } as const;
const use = { id: 'notes/Meta+n', layout: german, day: 20_029, by: 'keys' } as const;

/** The store in an app that provides `repository`, and changes whose reset the test sends. */
function storeWith(repository: Partial<UsageRepository>) {
  const onProgressReset = vi.fn<Changes['onProgressReset']>(() => vi.fn());
  const changes: Changes = { ...missingChanges, onProgressReset };
  const app = createApp({})
    .use(createPinia())
    .provide(usageRepositoryKey, {
      load: () => Promise.resolve(ok([count])),
      recordUse: () => Promise.resolve(ok(undefined)),
      ...repository,
    })
    .provide(changesKey, changes);
  const store = app.runWithContext(() => useUsageStore());

  return {
    store,
    reset: () => {
      onProgressReset.mock.calls.forEach(([listener]) => {
        listener();
      });
    },
  };
}

describe('useUsageStore', () => {
  it('loads the counts of a layout over the last 30 days', async () => {
    const load = vi.fn<UsageRepository['load']>(() => Promise.resolve(ok([count])));
    const { store } = storeWith({ load });

    await store.load(german, 20_029);

    expect(load).toHaveBeenCalledWith(german, 20_000);
    expect(store.usage).toStrictEqual({
      status: 'loaded',
      value: { layout: german, counts: [count] },
    });
  });

  it('drops the counts of a layout asked for before another', async () => {
    const { store } = storeWith({});

    const first = store.load(german, 20_029);
    const second = store.load(us, 20_029);
    await Promise.all([first, second]);

    expect(store.usage).toMatchObject({ value: { layout: us } });
  });

  it('adds a recorded use to the counts shown', async () => {
    const { store } = storeWith({});

    await store.load(german, 20_029);
    await store.record(use);

    expect(store.usage).toMatchObject({ value: { counts: [{ ...count, byKeys: 3 }] } });
  });

  it('shows nothing new when a use could not be recorded', async () => {
    const { store } = storeWith({
      recordUse: () => Promise.resolve(err({ kind: 'database', message: 'locked' })),
    });

    await store.load(german, 20_029);

    await expect(store.record(use)).resolves.toMatchObject({ kind: 'err' });
    expect(store.usage).toMatchObject({ value: { counts: [count] } });
  });

  it('forgets the counts when progress is reset', async () => {
    const { store, reset } = storeWith({});

    await store.load(german, 20_029);
    reset();

    expect(store.usage).toStrictEqual({ status: 'loaded', value: { layout: german, counts: [] } });
  });
});
