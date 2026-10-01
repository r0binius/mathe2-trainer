// @vitest-environment happy-dom
import { createPinia } from 'pinia';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, effectScope } from 'vue';

import type { CurrentLayout } from '@/domain/keyboard/keymap';
import { checkShortcut } from '@/domain/keyboard/policy';
import type { ProgressRepository } from '@/domain/progress/repository';
import type { SummaryContext } from '@/domain/progress/summary';
import type { SettingsRepository } from '@/domain/settings/repository';
import type { Settings } from '@/domain/settings/settings';
import type { Loadable } from '@/domain/shared/loadable';
import { err, ok } from '@/domain/shared/result';
import type { KeymapSource } from '@/ports';
import {
  keymapSourceKey,
  missingKeymapSource,
  progressRepositoryKey,
  settingsRepositoryKey,
} from '@/ports';
import { useKeymapStore } from '@/stores/keymap';
import { useProgressStore } from '@/stores/progress';
import { useSettingsStore } from '@/stores/settings';

import { useSummaryContext } from './useSummaryContext';

const us: CurrentLayout = { id: 'com.apple.keylayout.US', keymap: {} };

const settings: Settings = {
  trigger: { kind: 'shortcut', keys: ['Shift', 'Meta', 'm'] },
  showMenuBarIcon: true,
  showDockIcon: true,
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
    loadLog: unused,
    saveSet: unused,
    recordReview: unused,
    replace: unused,
    reset: unused,
  };
  const keymapSource: KeymapSource = {
    load: () => Promise.resolve(ok(us)),
    onChange: missingKeymapSource.onChange,
  };
  const app = createApp({})
    .use(pinia)
    .provide(settingsRepositoryKey, settingsRepository)
    .provide(progressRepositoryKey, progressRepository)
    .provide(keymapSourceKey, keymapSource);

  // A scope, as a component would give it, which ends listening for focus.
  return app.runWithContext(() => ({
    context: effectScope().run(useSummaryContext) ?? expect.unreachable(),
    load: () =>
      Promise.all([
        useSettingsStore().load(),
        useKeymapStore().load(),
        useProgressStore().load([]),
      ]),
  }));
}

const day = 24 * 60 * 60 * 1000;

function endOfTodayIn(context: Loadable<SummaryContext>): number {
  return context.status === 'loaded' ? context.value.endOfToday : 0;
}

describe('useSummaryContext', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it('moves the end of today on when the window gains focus the next day', async () => {
    vi.useFakeTimers({ now: new Date(2026, 8, 30, 12) });
    const { context, load } = appWith(() => Promise.resolve(ok(settings)));
    await load();
    const first = endOfTodayIn(context.value);

    vi.setSystemTime(new Date(2026, 9, 1, 12));
    window.dispatchEvent(new Event('focus'));

    expect(endOfTodayIn(context.value) - first).toBe(day);
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
