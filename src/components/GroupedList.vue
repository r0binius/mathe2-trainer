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
/* A grouped box: a hairline around it and between its rows, from edge to edge. */
.list {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-box);
  background-color: var(--color-box);
  list-style: none;

  > :deep(* + *) {
    border-top: 1px solid var(--color-border);
  }
}
</style>
