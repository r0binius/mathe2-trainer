<script setup lang="ts">
import type { IconName } from './icons';
import { icons } from './icons';

const { size = 14 } = defineProps<{
  /** Which icon to show. */
  name: IconName;
  /** Its width and height in pixels. */
  size?: number;
}>();
</script>

<template>
  <svg
    class="icon"
    :class="{ filled: icons[name].filled }"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path :d="icons[name].d" fill-rule="evenodd" />
  </svg>
</template>

<style scoped>
.icon {
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.filled {
  fill: currentColor;
  stroke: none;
}
</style>
