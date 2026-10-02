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
/* A key in a list: its glyph in mono, in full text color, one after the other. */
.key {
  display: inline-flex;
  justify-content: center;
  min-width: 12px;
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
}
</style>
