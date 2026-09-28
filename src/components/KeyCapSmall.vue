<script setup lang="ts">
import type { KeyLabel } from '@/domain/keyboard/labels';

defineProps<{
  /** What the key shows. */
  label: KeyLabel;
}>();
</script>

<template>
  <kbd class="key" :title="label.name">{{ label.symbol }}</kbd>
</template>

<style scoped>
.key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 3px;
  border-radius: 3px;
  background-color: color-mix(in srgb, var(--color-white) 10%, transparent);
  color: color-mix(in srgb, var(--color-white) 70%, transparent);
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  transition: color 0.1s ease;
}
</style>
