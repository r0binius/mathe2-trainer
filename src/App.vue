<script setup lang="ts">
import { inject, provide, useTemplateRef } from 'vue';

import BaseButton from './components/BaseButton.vue';
import { useCoach } from './composables/useCoach';
import { focusFirstIn } from './composables/useSpatialNav';
import { useStartup } from './composables/useStartup';
import { apps } from './data/apps';
import LibrarySidebar from './features/library/LibrarySidebar.vue';
import { focusSidebarKey } from './features/library/sidebarFocus';
import { useText } from './i18n';
import { coachKey, consoleLogger, loggerKey, missingCoach } from './ports';
import { useSettingsStore } from './stores/settings';
import { useUsageStore } from './stores/usage';

const [context, retry] = useStartup(apps);
const text = useText();
const settings = useSettingsStore();
const usageStore = useUsageStore();

// Here because the main window lives as long as the app; closing it only hides it.
useCoach(
  apps,
  {
    coach: inject(coachKey, missingCoach),
    usage: { recordUse: usageStore.record },
    logger: inject(loggerKey, consoleLogger),
  },
  {
    context: () => (context.value.status === 'loaded' ? context.value.value : undefined),
    now: Date.now,
    showsBanner: () => settings.current?.showMenuBanner === true,
    appText: text.app,
  },
);
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
  color: var(--color-text-secondary);
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active {
    transition: none;
  }
}
</style>
