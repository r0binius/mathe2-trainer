import './styles/main.css';

import { createPinia } from 'pinia';
import { createApp } from 'vue';

import { macosKeyLabels } from './domain/keyboard/labels';
import { uiLanguageOf } from './domain/settings/language';
import SettingsWindow from './features/settings/SettingsWindow.vue';
import { createAppI18n } from './i18n';
import { tauriLogger } from './platform/log';
import { tauriPorts } from './platform/tauri';
import { logPolicyViolations } from './policyViolations';
import {
  changesKey,
  keyLabelsKey,
  keymapSourceKey,
  loggerKey,
  progressRepositoryKey,
  settingsRepositoryKey,
} from './ports';

const ports = tauriPorts();

logPolicyViolations(tauriLogger);

createApp(SettingsWindow)
  .use(createPinia())
  .use(createAppI18n(uiLanguageOf(navigator.languages)))
  .provide(settingsRepositoryKey, ports.settings)
  .provide(progressRepositoryKey, ports.progress)
  .provide(keymapSourceKey, ports.keymap)
  .provide(changesKey, ports.changes)
  .provide(keyLabelsKey, macosKeyLabels)
  .provide(loggerKey, tauriLogger)
  .mount('#app');
