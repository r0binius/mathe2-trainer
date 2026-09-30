import './styles/main.css';

import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import { apps } from './data/apps';
import { macosKeyLabels } from './domain/keyboard/labels';
import { uiLanguageOf } from './domain/settings/language';
import { createAppI18n } from './i18n';
import { tauriLogger } from './platform/log';
import { tauriRepositories } from './platform/tauri';
import {
  keyLabelsKey,
  keymapSourceKey,
  loggerKey,
  progressRepositoryKey,
  settingsRepositoryKey,
} from './ports';
import { createAppRouter } from './router';

const repositories = tauriRepositories();

createApp(App)
  .use(createPinia())
  .use(createAppI18n(uiLanguageOf(navigator.languages)))
  .use(createAppRouter(apps))
  .provide(settingsRepositoryKey, repositories.settings)
  .provide(progressRepositoryKey, repositories.progress)
  .provide(keymapSourceKey, repositories.keymap)
  .provide(keyLabelsKey, macosKeyLabels)
  .provide(loggerKey, tauriLogger)
  .mount('#app');
