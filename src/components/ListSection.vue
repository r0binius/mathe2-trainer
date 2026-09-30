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
/* A grouped form's section header, as in System Settings. */
.title {
  margin: 0 0 6px 2px;
  font-size: 13px;
  font-weight: 600;
}
</style>
