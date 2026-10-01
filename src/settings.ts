import './styles/main.css';

import SettingsWindow from './features/settings/SettingsWindow.vue';
import { createWindow } from './window';

createWindow(SettingsWindow).mount('#app');
