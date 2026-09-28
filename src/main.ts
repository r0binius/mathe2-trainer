import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import { tauriRepositories } from './platform/tauri';
import { progressRepositoryKey, settingsRepositoryKey } from './stores/repositories';

const repositories = tauriRepositories();

createApp(App)
  .use(createPinia())
  .provide(settingsRepositoryKey, repositories.settings)
  .provide(progressRepositoryKey, repositories.progress)
  .mount('#app');
