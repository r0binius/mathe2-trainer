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
  padding: 20px 0 16px;
}

.text {
  flex: 1 1 auto;
  min-width: 0;
}

/* macOS's large title. */
.title {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
}

.meta {
  margin-top: 2px;
  color: var(--color-text-secondary);
}
</style>
