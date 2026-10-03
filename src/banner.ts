import './styles/main.css';
import './styles/panel.css';

import BannerWindow from './features/banner/BannerWindow.vue';
import { createWindow } from './window';

createWindow(BannerWindow).mount('#app');
