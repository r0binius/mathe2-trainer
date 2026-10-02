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
    <h2 class="title caption">{{ title }}</h2>
    <slot />
  </section>
</template>

<style scoped>
.title {
  margin: 0 0 6px 1px;
}
</style>
