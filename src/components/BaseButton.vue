<script setup lang="ts">
import BaseIcon from './BaseIcon.vue';
import type { IconName } from './icons';

const { variant = 'neutral', size = 'regular' } = defineProps<{
  /** An icon before the label, or instead of one. */
  icon?: IconName;
  /** What an icon-only button does, for VoiceOver and as its tooltip. */
  label?: string;
  /**
   * How much the button stands out: `neutral` for most, `accent` for the one main action on a
   * screen, `danger` for destructive actions and `dangerText` for a destructive action next to
   * text.
   */
  variant?: 'neutral' | 'accent' | 'danger' | 'dangerText';
  /** `large` for a screen's main action next to its heading. */
  size?: 'regular' | 'large';
}>();

const emit = defineEmits<{
  /** The button was clicked, or pressed with Enter or Space while focused. */
  click: [event: MouseEvent];
}>();
</script>

<template>
  <button
    class="button"
    :class="[variant, size]"
    type="button"
    :aria-label="label"
    :title="label"
    @click="emit('click', $event)"
  >
    <BaseIcon v-if="icon" :name="icon" />
    <slot />
  </button>
</template>

<style scoped>
.button {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 6px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.large {
  padding: 10px 14px;
}

.neutral {
  background-color: color-mix(in srgb, var(--color-white) 8%, transparent);
  color: color-mix(in srgb, var(--color-white) 50%, transparent);

  &:hover,
  &:focus-visible {
    background-color: color-mix(in srgb, var(--color-white) 12%, transparent);
    color: var(--color-white);
  }
}

.accent {
  background-color: var(--color-yellow);
  color: var(--color-black);

  &:hover,
  &:focus-visible {
    background-color: color-mix(in srgb, var(--color-yellow) 90%, transparent);
  }

  /* The main action is often focused from the start, so its focus also shows as a ring. */
  &:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--color-yellow) 40%, transparent);
    outline-offset: 2px;
  }
}

.danger {
  background-color: var(--color-red);
  color: var(--color-black);

  &:hover,
  &:focus-visible {
    background-color: color-mix(in srgb, var(--color-red) 90%, transparent);
  }
}

.dangerText {
  padding: 0;
  color: var(--color-red);
}
</style>
