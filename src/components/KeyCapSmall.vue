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
/* A key as macOS menus show shortcuts: its glyph in secondary text, one after the other. */
.key {
  display: inline-flex;
  justify-content: center;
  min-width: 13px;
  color: var(--color-label-secondary);
  font-family: inherit;
  font-size: 13px;
  line-height: 1;
}
</style>
