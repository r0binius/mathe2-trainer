<script setup lang="ts">
import { inject, onScopeDispose, ref } from 'vue';

import KeyCapSmall from '@/components/KeyCapSmall.vue';
import { useKeyLabels } from '@/composables/useKeyLabels';
import type { Banner } from '@/domain/usage/banner';
import { coachKey, missingCoach } from '@/ports';

const labelOf = useKeyLabels();
const banner = ref<Banner>();
/** How many banners were shown, so each one plays its fade from the start. */
const shown = ref(0);

onScopeDispose(
  inject(coachKey, missingCoach).onBannerShown((next) => {
    banner.value = next;
    shown.value += 1;
  }),
);
</script>

<template>
  <main :key="shown" class="banner" role="status">
    <template v-if="banner !== undefined">
      <span class="title truncate">{{ banner.title }}</span>
      <span class="keys">
        <KeyCapSmall v-for="key in banner.keys" :key="key" :label="labelOf(key)" />
      </span>
    </template>
  </main>
</template>

<style scoped>
/* The popover's panel, in one row: the title, then its keys. Rust hides the window once it faded. */
.banner {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100vh;
  padding: 0 14px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-box);
  color: var(--color-text);
  animation: shown 2s both;
}

.title {
  flex: 1 1 auto;
  font-weight: 500;
}

.keys {
  display: inline-flex;
  flex: none;
  gap: 2px;
}

@keyframes shown {
  0% {
    opacity: 0;
  }

  8%,
  85% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .banner {
    animation: none;
  }
}
</style>
