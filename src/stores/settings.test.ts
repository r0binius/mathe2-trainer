import { createPinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from 'vue';

import type { SettingsRepository } from '@/domain/settings/repository';
import type { Settings } from '@/domain/settings/settings';
import { err, ok } from '@/domain/shared/result';
import { settingsRepositoryKey } from '@/ports';

import { useSettingsStore } from './settings';

const settings: Settings = {
  trigger: { kind: 'holdCommand' },
  showMenuBarIcon: true,
  showDockIcon: true,
  launchAtLogin: true,
  language: 'system',
};

const locked = { kind: 'database', message: 'database is locked' } as const;

function storeWith(repository: Partial<SettingsRepository>) {
  const pinia = createPinia();
  const fallback: SettingsRepository = {
    load: () => Promise.resolve(ok(settings)),
    save: () => Promise.resolve(ok(undefined)),
  };

  createApp({})
    .use(pinia)
    .provide(settingsRepositoryKey, { ...fallback, ...repository });

  return useSettingsStore(pinia);
}

describe('useSettingsStore', () => {
  it('is loading until it loaded the settings', async () => {
    const store = storeWith({});

    expect(store.settings).toStrictEqual({ status: 'loading' });
    await store.load();
    expect(store.settings).toStrictEqual({ status: 'loaded', value: settings });
  });

  it('shows that loading failed', async () => {
    const store = storeWith({ load: () => Promise.resolve(err(locked)) });

    await store.load();
    expect(store.settings).toStrictEqual({ status: 'failed', error: locked });
  });

  it('changes the settings once they are saved', async () => {
    const store = storeWith({});
    const changed = { ...settings, showDockIcon: false };

    await store.load();
    await expect(store.save(changed)).resolves.toStrictEqual(ok(undefined));
    expect(store.settings).toStrictEqual({ status: 'loaded', value: changed });
  });

  it('keeps the settings when saving them failed, and passes the error on', async () => {
    const save = vi.fn(() => Promise.resolve(err(locked)));
    const store = storeWith({ save });

    await store.load();
    await expect(store.save({ ...settings, showDockIcon: false })).resolves.toStrictEqual(
      err(locked),
    );
    expect(store.settings).toStrictEqual({ status: 'loaded', value: settings });
  });
});
