import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import { createApp } from 'vue';

import type { CurrentLayout, KeymapSource } from '@/domain/keyboard/keymap';
import { checkShortcut } from '@/domain/keyboard/policy';
import type { ProgressRepository } from '@/domain/progress/repository';
import type { SettingsRepository } from '@/domain/settings/repository';
import type { Settings } from '@/domain/settings/settings';
import { err, ok } from '@/domain/shared/result';
import { keymapSourceKey, progressRepositoryKey, settingsRepositoryKey } from '@/ports';
import { useKeymapStore } from '@/stores/keymap';
import { useProgressStore } from '@/stores/progress';
import { useSettingsStore } from '@/stores/settings';

import { useSummaryContext } from './useSummaryContext';

const us: CurrentLayout = { id: 'com.apple.keylayout.US', keymap: {} };

const settings: Settings = {
  trigger: { kind: 'shortcut', keys: ['Shift', 'Meta', 'm'] },
  showMenuBarIcon: true,
  showDockIcon: true,
  launchAtLogin: true,
  language: 'system',
};

const locked = { kind: 'database', message: 'database is locked' } as const;

function unused(): never {
  return expect.unreachable();
}

function appWith(loadSettings: SettingsRepository['load']) {
  const pinia = createPinia();
  const settingsRepository: SettingsRepository = { load: loadSettings, save: unused };
  const progressRepository: ProgressRepository = {
    load: () => Promise.resolve(ok({ progress: { sets: [], cards: [] }, skipped: [] })),
    saveSet: unused,
    recordReview: unused,
    replace: unused,
    reset: unused,
  };
  const keymapSource: KeymapSource = { load: () => Promise.resolve(ok(us)) };
  const app = createApp({})
    .use(pinia)
    .provide(settingsRepositoryKey, settingsRepository)
    .provide(progressRepositoryKey, progressRepository)
    .provide(keymapSourceKey, keymapSource);

  return app.runWithContext(() => ({
    context: useSummaryContext(),
    load: () =>
      Promise.all([
        useSettingsStore().load(),
        useKeymapStore().load(),
        useProgressStore().load([]),
      ]),
  }));
}

describe('useSummaryContext', () => {
  it('is loading until the settings, the layout and the progress are loaded', () => {
    const { context } = appWith(() => Promise.resolve(ok(settings)));

    expect(context.value).toStrictEqual({ status: 'loading' });
  });

  it('summarizes with the loaded layout and progress, and today ending later today', async () => {
    const { context, load } = appWith(() => Promise.resolve(ok(settings)));

    await load();

    expect(context.value).toMatchObject({
      status: 'loaded',
      value: { keymap: us.keymap, layout: us.id, progress: { sets: [], cards: [] } },
    });
    expect(context.value.status === 'loaded' && context.value.value.endOfToday).toBeGreaterThan(
      Date.now(),
    );
  });

  it("reserves the popover's shortcut in the practice policy", async () => {
    const { context, load } = appWith(() => Promise.resolve(ok(settings)));

    await load();

    const policy = context.value.status === 'loaded' ? context.value.value.policy : [];
    expect(checkShortcut(policy, ['Shift', 'Meta', 'm'])).toStrictEqual(
      err({ reason: 'reserved' }),
    );
  });

  it('fails when one of them failed to load', async () => {
    const { context, load } = appWith(() => Promise.resolve(err(locked)));

    await load();

    expect(context.value).toStrictEqual({ status: 'failed', error: locked });
  });
});
