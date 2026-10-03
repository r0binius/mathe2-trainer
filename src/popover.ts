import './styles/main.css';
import './styles/panel.css';

import { apps } from './data/apps';
import PopoverWindow from './features/popover/PopoverWindow.vue';
import { createWindow } from './window';

createWindow(PopoverWindow, { apps }).mount('#app');
