<script setup lang="ts">
import BaseIcon from './BaseIcon.vue';
import type { IconName } from './icons';

const {
  variant = 'neutral',
  size = 'regular',
  // eslint-disable-next-line @typescript-eslint/no-useless-default-assignment -- not useless in Vue: without a default, an absent boolean prop is cast to `false`, and `aria-pressed="false"` makes every button a toggle, which screen readers announces as a checkbox.
  pressed = undefined,
} = defineProps<{
  /** An icon before the label, or instead of one. */
  icon?: IconName;
  /** What an icon-only button does, for screen readers and as its tooltip. */
  label?: string;
  /**
   * What kind of button it is: `neutral` a quiet button, `accent` the one main action on a
   * screen, `danger` a quiet button for a destructive action, `dangerText` a destructive action
   * next to text, and `toolbar` a borderless button in the title bar.
   */
  variant?: 'neutral' | 'accent' | 'danger' | 'dangerText' | 'toolbar';
  /** `large` for a screen's main action next to its heading. */
  size?: 'regular' | 'large';
  /** Whether a button that stands for a choice is the one chosen, for screen readers. */
  pressed?: boolean;
  /** Whether the button can't be used right now. */
  disabled?: boolean;
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
    :disabled="disabled"
    @click="emit('click', $event)"
  >
    <BaseIcon v-if="icon" :name="icon" />
    <slot />
  </button>
</template>

<style scoped>
/* A flat button of a fixed height, its label centred both ways by the flex box, not by padding. */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 12px;
  cursor: pointer;
  border-radius: var(--radius-control);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
}

.large {
  min-height: 40px;
  padding: 0 18px;
  font-size: 15px;
}

/* A finger needs about 44 pixels. */
@media (pointer: coarse) {
  .button {
    min-height: 40px;
  }

  .large {
    min-height: 48px;
  }

  .toolbar {
    min-width: 40px;
  }
}

/* A quiet button: raised, with a hairline. */
.neutral,
.danger {
  border: 1px solid var(--color-border);
  background-color: var(--color-raised);

  &:hover {
    background-color: color-mix(in srgb, var(--color-raised), var(--color-text) 4%);
  }

  &:active {
    background-color: color-mix(in srgb, var(--color-raised), var(--color-text) 8%);
  }
}

.danger {
  color: var(--color-mistake);
}

/* The screen's main action, in the action color. */
.accent {
  background-color: var(--color-action);
  color: var(--color-on-action);

  &:hover {
    filter: brightness(1.06);
  }

  &:active {
    filter: brightness(0.92);
  }
}

.dangerText {
  padding: 0;
  color: var(--color-mistake);
}

/* A title bar item: flat, with a fill under the pointer. */
.toolbar {
  min-width: 32px;
  min-height: 32px;
  padding: 0 6px;
  color: var(--color-text-secondary);

  &:hover {
    background-color: var(--color-fill);
    color: var(--color-text);
  }

  &:active {
    background-color: var(--color-fill-hover);
  }
}
</style>
