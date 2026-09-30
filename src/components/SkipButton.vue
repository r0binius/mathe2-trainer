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
/* A borderless toolbar-style button whose word appears when you reach for it. */
.skip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 28px;
  padding: 0 8px;
  border-radius: var(--radius-control);
  color: var(--color-label-secondary);

  &:hover {
    background-color: var(--color-fill);
    color: var(--color-label);
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
