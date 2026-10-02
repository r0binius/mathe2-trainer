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
/* A quiet borderless button whose word appears when you reach for it. */
.skip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius-control);
  color: var(--color-text-secondary);

  &:hover {
    background-color: var(--color-fill);
    color: var(--color-text);
  }
}

.label {
  opacity: 0;
  transition: opacity 0.2s ease;

  .skip:hover &,
  .skip:focus-visible & {
    opacity: 1;
  }
}
</style>
