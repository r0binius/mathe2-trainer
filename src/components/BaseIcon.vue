<script setup lang="ts">
import type { IconName } from './icons';
import { icons } from './icons';

defineProps<{
  /** Which icon to show. */
  name: IconName;
}>();
</script>

<template>
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path :d="icons[name]" fill-rule="evenodd" />
  </svg>
</template>

<style scoped>
.icon {
  width: 14px;
  height: 14px;
  flex: none;
  fill: currentColor;
}
</style>
