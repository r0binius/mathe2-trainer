// @vitest-environment happy-dom
import { createPinia } from 'pinia';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h } from 'vue';

import type { KeymapSource } from '@/domain/keyboard/keymap';
import type { ProgressRepository } from '@/domain/progress/repository';
import type { SettingsRepository } from '@/domain/settings/repository';
import type { Settings } from '@/domain/settings/settings';
import type { PlatformError } from '@/domain/shared/platformError';
import type { Result } from '@/domain/shared/result';
import { err, ok } from '@/domain/shared/result';
import { createAppI18n } from '@/i18n';
import { keymapSourceKey, progressRepositoryKey, settingsRepositoryKey } from '@/ports';

import { useStartup } from './useStartup';

const german: Settings = {
  trigger: { kind: 'holdCommand' },
  showMenuBarIcon: true,
  showDockIcon: true,
  launchAtLogin: true,
  language: 'de',
};

function unused(): never {
  return expect.unreachable();
}

/** Mounts a window that starts up with the given settings, and shows the context's status. */
async function startWith(settings: Result<Settings, PlatformError>) {
  const settingsRepository: SettingsRepository = {
    load: () => Promise.resolve(settings),
    save: unused,
  };
  const progressRepository: ProgressRepository = {
    load: vi.fn(() => Promise.resolve(ok({ progress: { sets: [], cards: [] }, skipped: [] }))),
    saveSet: unused,
    recordReview: unused,
    replace: unused,
    reset: unused,
  };
  const keymapSource: KeymapSource = {
    load: () => Promise.resolve(ok({ id: 'com.apple.keylayout.German', keymap: {} })),
  };
  const Window = defineComponent(() => {
    const [context, retry] = useStartup([]);

    return () => h('button', { onClick: retry }, context.value.status);
  });
  const host = document.createElement('div');

  createApp(Window)
    .use(createPinia())
    .use(createAppI18n('en'))
    .provide(settingsRepositoryKey, settingsRepository)
    .provide(progressRepositoryKey, progressRepository)
    .provide(keymapSourceKey, keymapSource)
    .mount(host);
  await vi.waitFor(() => {
    expect(host.textContent).not.toBe('loading');
  });

  return { host, progressRepository };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useStartup', () => {
  it('loads the settings, the layout and the progress once the window is mounted', async () => {
    const { host, progressRepository } = await startWith(ok(german));

    expect(host.textContent).toBe('loaded');
    expect(progressRepository.load).toHaveBeenCalledOnce();
  });

  it('switches the UI to the chosen language, and tells the document', async () => {
    await startWith(ok(german));

    expect(document.documentElement.getAttribute('lang')).toBe('de');
  });

  it('loads again when asked to try again', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { host, progressRepository } = await startWith(
      err({ kind: 'database', message: 'database is locked' }),
    );

    host.querySelector('button')?.click();
    await vi.waitFor(() => {
      expect(progressRepository.load).toHaveBeenCalledTimes(2);
    });
    expect(logged).toHaveBeenCalled();
  });

  it('logs why loading failed', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { host } = await startWith(err({ kind: 'database', message: 'database is locked' }));

    expect(host.textContent).toBe('failed');
    expect(logged).toHaveBeenCalledWith('Could not load: database is locked');
  });
});
