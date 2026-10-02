<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

import BaseIcon from './BaseIcon.vue';

defineProps<{
  /** Where the row leads. */
  to: RouteLocationRaw;
}>();

defineSlots<{
  /** Before the title, such as an app's logo. */
  leading?: () => unknown;
  /** The row's title, cut off with an ellipsis when it's too long. */
  default: () => unknown;
  /** After the title, muted, such as a count or the progress. */
  meta?: () => unknown;
}>();
</script>

<template>
  <RouterLink class="row" :to="to">
    <slot name="leading" />
    <span class="title truncate"><slot /></span>
    <span class="meta"><slot name="meta" /></span>
    <BaseIcon class="arrow" name="chevronRight" :size="10" />
  </RouterLink>
</template>

<style scoped>
/* A row that opens another page, with a chevron at its end. */
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
  padding: 3px 10px;

  &:hover {
    background-color: var(--color-fill);
  }

  &:active {
    background-color: var(--color-fill-hover);
  }
}

.title {
  flex: 1 1 auto;
}

.meta {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  font-size: 12px;
}

.arrow {
  flex: none;
  color: var(--color-text-tertiary);
}
</style>
