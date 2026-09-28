<script setup lang="ts">
import BaseIcon from './BaseIcon.vue';

const emit = defineEmits<{
  /** The button was clicked. */
  click: [event: MouseEvent];
}>();

defineSlots<{
  /** The label, shown while the pointer is over the button. */
  default: () => unknown;
}>();
</script>

<template>
  <button class="skip" type="button" @click="emit('click', $event)">
    <span class="label"><slot /></span>
    <BaseIcon name="skip" />
  </button>
</template>

<style scoped>
.skip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px;
  border-radius: 6px;
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;

  &:hover,
  &:focus-visible {
    background-color: var(--color-surface);
    color: var(--color-white);
  }
}

/* The icon says what it does; the word appears when you reach for it. */
.label {
  opacity: 0;
  transition: opacity 0.2s ease;

  .skip:hover &,
  .skip:focus-visible & {
    opacity: 1;
  }
}
</style>
