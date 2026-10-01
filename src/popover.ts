import './styles/main.css';
import './styles/popover.css';

import { createPinia } from 'pinia';
import { createApp } from 'vue';

import { apps } from './data/apps';
import { macosKeyLabels } from './domain/keyboard/labels';
import { uiLanguageOf } from './domain/settings/language';
import PopoverWindow from './features/popover/PopoverWindow.vue';
import { createAppI18n } from './i18n';
import { tauriLogger } from './platform/log';
import { tauriPorts } from './platform/tauri';
import { logPolicyViolations } from './policyViolations';
import {
  changesKey,
  keyLabelsKey,
  keymapSourceKey,
  loggerKey,
  lookupKey,
  settingsRepositoryKey,
  windowsKey,
} from './ports';

const ports = tauriPorts();

logPolicyViolations(tauriLogger);

createApp(PopoverWindow, { apps })
  .use(createPinia())
  .use(createAppI18n(uiLanguageOf(navigator.languages)))
  .provide(settingsRepositoryKey, ports.settings)
  .provide(keymapSourceKey, ports.keymap)
  .provide(changesKey, ports.changes)
  .provide(keyLabelsKey, macosKeyLabels)
  .provide(windowsKey, ports.windows)
  .provide(lookupKey, ports.lookup)
  .provide(loggerKey, tauriLogger)
  .mount('#app');
