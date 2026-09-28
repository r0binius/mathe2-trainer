<script setup lang="ts">
defineProps<{
  /** The section's heading. */
  title: string;
}>();

defineSlots<{
  /** The section's items. */
  default: () => unknown;
}>();
</script>

<template>
  <section class="section">
    <h2 class="title">{{ title }}</h2>
    <slot />
  </section>
</template>

<style scoped>
.title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  opacity: 0.5;
}
</style>
