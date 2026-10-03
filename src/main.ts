import './styles/main.css';

import { createPinia } from 'pinia';
import { createApp, shallowRef } from 'vue';

import App from './App.vue';
import { topics } from './data/topics';
import { mathStyles } from './platform/math';
import { progressRepository } from './platform/storage';
import type { Tutor } from './platform/tutor';
import { findTutor } from './platform/tutor';
import { repositoryKey, tutorKey } from './ports';
import { createAppRouter } from './router';
import { useProgressStore } from './stores/progress';

// MathJax's own styles for the SVG formulas, added once.
const style = document.createElement('style');
// eslint-disable-next-line functional/immutable-data -- filling a new element, before it joins the page
style.textContent = mathStyles();
document.head.append(style);

// The tutor arrives later, if at all: the page shows its buttons once it's there.
const tutor = shallowRef<Tutor | undefined>(undefined);
void findTutor().then((found) => {
  tutor.value = found;
});

const app = createApp(App, { topics })
  .use(createPinia())
  .provide(repositoryKey, progressRepository())
  .provide(tutorKey, tutor)
  .use(createAppRouter(topics));

void app.runWithContext(() => useProgressStore().load());
app.mount('#app');
