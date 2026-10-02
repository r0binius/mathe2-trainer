<script setup lang="ts">
import BaseIcon from './BaseIcon.vue';
import type { IconName } from './icons';

const { variant = 'neutral', size = 'regular' } = defineProps<{
  /** An icon before the label, or instead of one. */
  icon?: IconName;
  /** What an icon-only button does, for VoiceOver and as its tooltip. */
  label?: string;
  /**
   * What kind of macOS button it is: `neutral` a push button, `accent` the default button (the
   * one main action on a screen), `danger` a push button for a destructive action, `dangerText`
   * a destructive action next to text, and `toolbar` a borderless button in a toolbar.
   */
  variant?: 'neutral' | 'accent' | 'danger' | 'dangerText' | 'toolbar';
  /** `large` for a screen's main action next to its heading, as macOS's large control size. */
  size?: 'regular' | 'large';
  /** Whether a button that stands for a choice is the one chosen, for VoiceOver. */
  pressed?: boolean;
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
    :aria-pressed="pressed"
    :title="label"
    @click="emit('click', $event)"
  >
    <BaseIcon v-if="icon" :name="icon" />
    <slot />
  </button>
</template>

<style scoped>
/* A push button of macOS's regular control size. */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 22px;
  padding: 0 10px;
  border-radius: var(--radius-control);
  font-size: 13px;
  line-height: 1;
  white-space: nowrap;
}

.large {
  min-height: 28px;
  padding: 0 14px;
  font-weight: 500;
}

.neutral,
.danger {
  background-color: var(--color-button);
  box-shadow: var(--shadow-button);

  &:active {
    background-color: var(--color-button-pressed);
  }
}

.danger {
  color: var(--color-mistake);
}

.accent {
  background-color: var(--color-action);
  box-shadow: var(--shadow-button);
  color: var(--color-on-action);

  &:active {
    filter: brightness(0.9);
  }
}

.dangerText {
  padding: 0;
  color: var(--color-mistake);
}

/* A toolbar item: a glass capsule, as on macOS 27. */
.toolbar {
  min-width: 36px;
  min-height: 36px;
  padding: 0 10px;
  background-color: var(--color-capsule);
  box-shadow: inset 0 0 0 0.5px var(--color-capsule-edge);

  &:active {
    background-color: var(--color-fill-hover);
  }
}
</style>
