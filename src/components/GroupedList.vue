<script setup lang="ts">
const { tag = 'div' } = defineProps<{
  /** The list's element: `ul` for a list of items, `div` for a list of links. */
  tag?: 'ul' | 'div';
}>();

defineSlots<{
  /** The rows, separated by hairlines. */
  default: () => unknown;
}>();
</script>

<template>
  <component :is="tag" class="list"><slot /></component>
</template>

<style scoped>
/* A grouped box, as the lists in System Settings are: no border, and separators inset. */
.list {
  overflow: hidden;
  border-radius: var(--radius-box);
  background-color: var(--color-box);
  list-style: none;

  > :deep(*) {
    position: relative;
  }

  > :deep(* + *)::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 12px;
    height: 1px;
    background-color: var(--color-border);
  }
}
</style>
