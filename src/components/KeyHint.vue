<script setup lang="ts">
defineProps<{
  /** What the key shows, such as "1" or "Leertaste". */
  label: string;
}>();
</script>

<template>
  <kbd class="key" aria-hidden="true">{{ label }}</kbd>
</template>

<style scoped>
/* A small key cap next to a button's label: the key that does the same. */
.key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border: 1px solid var(--color-border);
  border-bottom-width: 2px;
  border-bottom-color: var(--color-key-edge);
  border-radius: 4px;
  background-color: var(--color-box);
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
}

/* Keys are for keyboards: a touch screen has none. */
@media (hover: none) {
  .key {
    display: none;
  }
}
</style>
