import './styles/main.css';

import App from './App.vue';
import { apps } from './data/apps';
import { createAppRouter } from './router';
import { createWindow } from './window';

createWindow(App).use(createAppRouter(apps)).mount('#app');
