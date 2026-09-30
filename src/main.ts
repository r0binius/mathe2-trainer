import './styles/main.css';

import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import { apps } from './data/apps';
import { macosKeyLabels } from './domain/keyboard/labels';
import { uiLanguageOf } from './domain/settings/language';
import { createAppI18n } from './i18n';
import { tauriLogger } from './platform/log';
import { tauriPorts } from './platform/tauri';
import {
  keyLabelsKey,
  keymapSourceKey,
  loggerKey,
  progressRepositoryKey,
  settingsRepositoryKey,
  windowsKey,
} from './ports';
import { createAppRouter } from './router';

const ports = tauriPorts();

createApp(App)
  .use(createPinia())
  .use(createAppI18n(uiLanguageOf(navigator.languages)))
  .use(createAppRouter(apps))
  .provide(settingsRepositoryKey, ports.settings)
  .provide(progressRepositoryKey, ports.progress)
  .provide(keymapSourceKey, ports.keymap)
  .provide(keyLabelsKey, macosKeyLabels)
  .provide(loggerKey, tauriLogger)
  .provide(windowsKey, ports.windows)
  .mount('#app');
