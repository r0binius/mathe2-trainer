import './styles/main.css';
import './styles/popover.css';

import { createApp } from 'vue';

import { uiLanguageOf } from './domain/settings/language';
import PopoverWindow from './features/popover/PopoverWindow.vue';
import { createAppI18n } from './i18n';
import { tauriLogger } from './platform/log';
import { tauriPorts } from './platform/tauri';
import { loggerKey, windowsKey } from './ports';

createApp(PopoverWindow)
  .use(createAppI18n(uiLanguageOf(navigator.languages)))
  .provide(windowsKey, tauriPorts().windows)
  .provide(loggerKey, tauriLogger)
  .mount('#app');
