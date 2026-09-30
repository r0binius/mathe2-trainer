import './styles/main.css';
import './styles/popover.css';

import { createApp } from 'vue';

import { uiLanguageOf } from './domain/settings/language';
import PopoverWindow from './features/popover/PopoverWindow.vue';
import { createAppI18n } from './i18n';

createApp(PopoverWindow)
  .use(createAppI18n(uiLanguageOf(navigator.languages)))
  .mount('#app');
