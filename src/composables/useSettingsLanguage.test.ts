// @vitest-environment happy-dom
import { createPinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h } from 'vue';
import { useI18n } from 'vue-i18n';

import type { Settings } from '@/domain/settings/settings';
import { ok } from '@/domain/shared/result';
import { createAppI18n } from '@/i18n';
import { settingsRepositoryKey } from '@/ports';
import { useSettingsStore } from '@/stores/settings';

import { useSettingsLanguage } from './useSettingsLanguage';

const german: Settings = {
  trigger: { kind: 'holdCommand' },
  showMenuBarIcon: true,
  showDockIcon: true,
  language: 'de',
  learnFromWork: false,
  showMenuBanner: true,
};

/** Mounts a window in English whose settings choose German, and shows its UI language. */
function mountWindow(loadSettings: boolean) {
  const Window = defineComponent(() => {
    const settings = useSettingsStore();
    const { locale } = useI18n();
    useSettingsLanguage();

    if (loadSettings) {
      void settings.load();
    }

    return () => h('p', locale.value);
  });
  const host = document.createElement('div');

  createApp(Window)
    .use(createPinia())
    .use(createAppI18n('en'))
    .provide(settingsRepositoryKey, {
      load: () => Promise.resolve(ok(german)),
      save: () => Promise.resolve(ok(undefined)),
    })
    .mount(host);

  return host;
}

describe('useSettingsLanguage', () => {
  it('switches the UI to the language the settings choose, once they are loaded', async () => {
    const host = mountWindow(true);

    await vi.waitFor(() => {
      expect(host.textContent).toBe('de');
    });
  });

  it('keeps the current language while the settings are not loaded', async () => {
    const host = mountWindow(false);

    await Promise.resolve();

    expect(host.textContent).toBe('en');
  });
});
