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
      <h1 class="title">{{ title }}</h1>
      <p v-if="slots.meta" class="meta"><slot name="meta" /></p>
    </div>
    <slot name="action" />
  </header>
</template>

<style scoped>
.heading {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 10px;
  padding-bottom: 10px;
}

.text {
  flex: 1 1 auto;
  min-width: 0;
}

/* The screen's title. */
.title {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.25;
}

.meta {
  margin-top: 1px;
  color: var(--color-text-secondary);
  font-size: 14px;
}
</style>
