<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import BaseButton from './components/BaseButton.vue';
import { useStartup } from './composables/useStartup';
import { apps } from './data/apps';
import OptionsPanel from './features/options/OptionsPanel.vue';
import { useText } from './i18n';
import { depthOf } from './routes';

const [context, retry] = useStartup(apps);
const route = useRoute();
const text = useText();

/** Whether the options panel is open over the screens. */
const optionsOpen = ref(false);

/** Deeper screens slide in over the current one; going back slides it away again. */
const slide = ref<'deeper' | 'back'>('deeper');

// Runs before the new screen renders, so its transition already has the right direction.
watch(
  () => depthOf(route),
  (depth, previous) => {
    slide.value = depth < previous ? 'back' : 'deeper';
  },
);
</script>

<template>
  <!-- The window fades in once there's something to show. -->
  <Transition name="fade" appear>
    <div v-if="context.status === 'loaded'" class="window">
      <!-- With options open, the screens step back and can't be reached until they close. -->
      <div class="screens" :class="{ behind: optionsOpen }" :inert="optionsOpen">
        <!-- Every screen summarizes progress, so each gets the loaded context. -->
        <RouterView v-slot="{ Component, route: shown }">
          <Transition :name="slide">
            <div :key="shown.path" class="screen">
              <component :is="Component" :context="context.value" />
            </div>
          </Transition>
        </RouterView>

        <BaseButton
          class="options-button"
          icon="options"
          :label="text.ui('page.options')"
          @click="optionsOpen = true"
        />
      </div>

      <Transition name="options">
        <OptionsPanel v-if="optionsOpen" class="options" @close="optionsOpen = false" />
      </Transition>
    </div>
    <div v-else-if="context.status === 'failed'" class="failed">
      <p>{{ text.ui('startup.failed') }}</p>
      <BaseButton @click="retry">{{ text.ui('startup.retry') }}</BaseButton>
    </div>
  </Transition>
</template>

<style scoped>
.window {
  position: relative;
  height: 100vh;
  overflow: hidden;
}

/* Steps back and darkens while the options panel is open. */
.screens {
  position: absolute;
  inset: 0;
  overflow: hidden;
  transform-origin: center 100%;
  transition:
    transform 0.6s var(--ease-in-out-quint),
    border-radius 0.6s var(--ease-in-out-quint);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 2;
    background-color: var(--color-black);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.6s var(--ease-in-out-quint);
  }
}

.behind {
  transform: scale(0.9) translateY(-8px);
  border-radius: 12px;

  &::after {
    opacity: 1;
  }
}

/* In the title bar's right corner, above whichever screen is shown. */
.options-button {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 1;
}

.options {
  position: absolute;
  inset: 60px 16px 0;
}

.options-enter-active,
.options-leave-active {
  transform-origin: center 0%;
  transition: transform 0.6s var(--ease-in-out-quint);
}

.options-enter-from,
.options-leave-to {
  transform: translateY(100%) scale(1.1);
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
  place-content: center;
  justify-items: center;
  gap: 16px;
  height: 100vh;
  padding: 32px;
  color: var(--color-text-muted);
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .screen,
  .screens,
  .screens::after,
  .options-enter-active,
  .options-leave-active,
  .fade-enter-active {
    transition: none;
  }
}
</style>
