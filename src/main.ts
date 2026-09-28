import './styles/main.css';

import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import { apps } from './data/apps';
import { uiLanguageOf } from './domain/settings/language';
import { createAppI18n } from './i18n';
import { germanKeymapSource } from './platform/keymap';
import { tauriRepositories } from './platform/tauri';
import { createAppRouter } from './router';
import {
  keymapSourceKey,
  progressRepositoryKey,
  settingsRepositoryKey,
} from './stores/repositories';

const repositories = tauriRepositories();

createApp(App)
  .use(createPinia())
  .use(createAppI18n(uiLanguageOf(navigator.languages)))
  .use(createAppRouter(apps))
  .provide(settingsRepositoryKey, repositories.settings)
  .provide(progressRepositoryKey, repositories.progress)
  .provide(keymapSourceKey, germanKeymapSource)
  .mount('#app');
