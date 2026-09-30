<script setup lang="ts">
defineProps<{
  /** How much is done. */
  value: number;
  /** How much there is to do. */
  max: number;
}>();
</script>

<template>
  <span class="progress">
    <span>{{ value }}</span>
    <span class="separator">&thinsp;/&thinsp;</span>
    <span>{{ max }}</span>
  </span>
</template>

<style scoped>
.progress {
  display: inline-flex;
}

.separator {
  color: var(--color-label-tertiary);
}
</style>
