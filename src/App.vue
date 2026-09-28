<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useSummaryContext } from './composables/useSummaryContext';
import { apps } from './data/apps';
import { useText } from './i18n';
import { depthOf } from './router';
import { useKeymapStore } from './stores/keymap';
import { useProgressStore } from './stores/progress';
import { useSettingsStore } from './stores/settings';

const settings = useSettingsStore();
const keymap = useKeymapStore();
const progress = useProgressStore();
const context = useSummaryContext();
const route = useRoute();
const text = useText();

/** Deeper screens slide in over the current one; going back slides it away again. */
const slide = ref<'deeper' | 'back'>('deeper');

onMounted(() => {
  void settings.load();
  void keymap.load();
  void progress.load(apps);
});

// Runs before the new screen renders, so its transition already has the right direction.
watch(
  () => depthOf(route),
  (depth, previous) => {
    slide.value = depth < previous ? 'back' : 'deeper';
  },
);

watch(context, (loaded) => {
  if (loaded.status === 'failed') {
    console.error(`Could not load: ${loaded.error.message}`);
  }
});
</script>

<template>
  <!-- The window fades in once there's something to show. -->
  <Transition name="fade" appear>
    <div v-if="context.status === 'loaded'" class="window">
      <!-- Every screen summarizes progress, so each gets the loaded context. -->
      <RouterView v-slot="{ Component, route: shown }">
        <Transition :name="slide">
          <div :key="shown.path" class="screen">
            <component :is="Component" :context="context.value" />
          </div>
        </Transition>
      </RouterView>
    </div>
    <p v-else-if="context.status === 'failed'" class="failed">{{ text.ui('startup.failed') }}</p>
  </Transition>
</template>

<style scoped>
.window {
  position: relative;
  height: 100vh;
  overflow: hidden;
}

/* Both screens overlap while one slides over the other. */
.screen {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 4px;
  transition:
    transform 0.6s var(--ease-in-out-quint),
    opacity 0.6s var(--ease-in-out-quint),
    border-radius 0.6s var(--ease-in-out-quint);
}

/* The screen underneath shrinks back and dims, as if it's further away. */
.deeper-leave-to,
.back-enter-from {
  transform: scale(0.8);
  border-radius: 24px;
  opacity: 0.5;
}

.deeper-enter-from,
.back-leave-to {
  transform: translateX(100%);
}

/* Going back, the returning screen stays underneath the one sliding away. */
.back-enter-active {
  z-index: -1;
}

.fade-enter-active {
  transition: opacity 0.6s ease-in-out;
}

.fade-enter-from {
  opacity: 0;
}

.failed {
  display: grid;
  place-items: center;
  height: 100vh;
  padding: 32px;
  color: color-mix(in srgb, var(--color-white) 50%, transparent);
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .screen,
  .fade-enter-active {
    transition: none;
  }
}
</style>
