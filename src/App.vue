<script setup lang="ts">
import { provide, useTemplateRef } from 'vue';

import BaseButton from './components/BaseButton.vue';
import { focusFirstIn } from './composables/useSpatialNav';
import { useStartup } from './composables/useStartup';
import { apps } from './data/apps';
import LibrarySidebar from './features/library/LibrarySidebar.vue';
import { focusSidebarKey } from './features/library/sidebarFocus';
import { useText } from './i18n';

const [context, retry] = useStartup(apps);
const text = useText();
const sidebar = useTemplateRef('sidebar');
const detail = useTemplateRef<HTMLElement>('detail');

provide(focusSidebarKey, () => {
  sidebar.value?.focusSelected();
});
</script>

<template>
  <!-- The window fades in once there's something to show. -->
  <Transition name="fade" appear>
    <div v-if="context.status === 'loaded'" class="window">
      <LibrarySidebar
        ref="sidebar"
        :apps="apps"
        :context="context.value"
        @enter="focusFirstIn(detail)"
      />
      <!-- Every page summarizes progress, so each gets the loaded context. -->
      <div ref="detail" class="detail">
        <RouterView v-slot="{ Component }">
          <component :is="Component" :context="context.value" />
        </RouterView>
      </div>
    </div>
    <div v-else-if="context.status === 'failed'" class="failed" data-tauri-drag-region>
      <p>{{ text.ui('startup.failed') }}</p>
      <BaseButton @click="retry">{{ text.ui('startup.retry') }}</BaseButton>
    </div>
  </Transition>
</template>

<style scoped>
/* The window is transparent, so the sidebar shows macOS's sidebar material behind it. */
:global(body) {
  background-color: transparent;
}

.window {
  display: grid;
  grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  height: 100vh;
}

.detail {
  min-width: 0;
  background-color: var(--color-content);
}

.fade-enter-active {
  transition: opacity 0.3s ease-in-out;
}

.fade-enter-from {
  opacity: 0;
}

.failed {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 16px;
  height: 100vh;
  padding: 32px;
  background-color: var(--color-window);
  color: var(--color-label-secondary);
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active {
    transition: none;
  }
}
</style>
