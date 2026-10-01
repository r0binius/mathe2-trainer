import './styles/main.css';
import './styles/popover.css';

import { createApp } from 'vue';

import { uiLanguageOf } from './domain/settings/language';
import PopoverWindow from './features/popover/PopoverWindow.vue';
import { createAppI18n } from './i18n';
import { tauriLogger } from './platform/log';
import { tauriPorts } from './platform/tauri';
import { logPolicyViolations } from './policyViolations';
import { loggerKey, lookupKey, windowsKey } from './ports';

logPolicyViolations(tauriLogger);

const ports = tauriPorts();

createApp(PopoverWindow)
  .use(createAppI18n(uiLanguageOf(navigator.languages)))
  .provide(windowsKey, ports.windows)
  .provide(lookupKey, ports.lookup)
  .provide(loggerKey, tauriLogger)
  .mount('#app');
