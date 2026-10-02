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
/* A section label: small uppercase mono, faint. */
.title {
  margin: 0 0 6px 1px;
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
