<script setup lang="ts">
defineProps<{
  /** What the screen is about, such as the app or set. */
  title: string;
}>();

const slots = defineSlots<{
  /** Shown before the title, such as the app's logo. */
  leading?: () => unknown;
  /** A muted line below the title, such as the progress. */
  meta?: () => unknown;
  /** The screen's main action, on the right. */
  action?: () => unknown;
}>();
</script>

<template>
  <header class="heading">
    <slot name="leading" />
    <div class="text">
      <h1 class="title truncate">{{ title }}</h1>
      <p v-if="slots.meta" class="meta"><slot name="meta" /></p>
    </div>
    <slot name="action" />
  </header>
</template>

<style scoped>
.heading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 40px 0 24px;
}

.text {
  flex: 1 1 auto;
  min-width: 0;
}

.title {
  font-size: 34px;
  font-weight: 700;
}

.meta {
  margin-top: 4px;
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 600;
}
</style>
