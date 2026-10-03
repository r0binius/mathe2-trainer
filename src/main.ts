import './styles/main.css';

import App from './App.vue';
import { apps } from './data/apps';
import { yourCommands } from './domain/usage/yourCommands';
import { createAppRouter } from './router';
import { useUsageStore } from './stores/usage';
import { createWindow } from './window';

// Your commands come from the usage counts, so the router asks the store when a route opens.
createWindow(App)
  .use(
    createAppRouter(apps, (app) => {
      const { counts } = useUsageStore();
      const set = counts && yourCommands(app, counts);

      return set === undefined ? [] : [set];
    }),
  )
  .mount('#app');
