<script setup lang="ts">
import type { KeyLabel } from '@/domain/keyboard/labels';

defineProps<{
  /** What the key shows. */
  label: KeyLabel;
  /** Whether the key is being tested: its outline is dashed and its label hidden until pressed. */
  hidden?: boolean;
  /** Whether the key is down, or shown as pressed: the keycap pops up over its outline. */
  pressed?: boolean;
  /** Whether pressing it was right, shown as a badge; no badge while undecided. */
  result?: 'correct' | 'wrong';
}>();
</script>

<template>
  <div class="key" :class="{ hidden, pressed }">
    <div class="outline">{{ label.symbol }}</div>

    <Transition name="pop-up">
      <div v-if="pressed" class="cap">{{ label.symbol }}</div>
    </Transition>

    <div v-if="label.name !== undefined" class="name">{{ label.name }}</div>

    <Transition name="pop-up">
      <svg v-if="result === 'correct'" class="badge correct" viewBox="0 0 14 14" aria-hidden="true">
        <circle cx="7" cy="7" r="7" />
        <path d="M9.625 4.375L5.8587 9.625L4.375 8.1413" />
      </svg>
      <svg
        v-else-if="result === 'wrong'"
        class="badge wrong"
        viewBox="0 0 14 14"
        aria-hidden="true"
      >
        <circle cx="7" cy="7" r="7" />
        <path d="M4.375 4.375L9.625 9.625M9.625 4.375L4.375 9.625" />
      </svg>
    </Transition>
  </div>
</template>

<style scoped>
.key {
  position: relative;
  display: inline-flex;
}

.outline,
.cap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
  height: 50px;
  padding: 0 10px;
  border-radius: 9px;
  font-size: 22px;
  font-weight: 700;
}

.outline {
  border: 3px solid color-mix(in srgb, var(--color-white) 20%, transparent);
  color: color-mix(in srgb, var(--color-white) 50%, transparent);

  .hidden & {
    border-style: dashed;
    color: transparent;
  }

  .pressed & {
    border-color: transparent;
  }
}

/* A white keycap on a darker 3px edge, so it looks raised. */
.cap {
  position: absolute;
  inset: 0;
  z-index: 0;
  color: var(--color-black);
  will-change: transform;

  &::before,
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
  }

  &::before {
    bottom: 3px;
    z-index: -1;
    background-color: var(--color-white);
  }

  &::after {
    z-index: -2;
    background-color: color-mix(in srgb, var(--color-white) 70%, transparent);
  }
}

.name {
  position: absolute;
  top: calc(100% + 8px);
  left: -2px;
  width: calc(100% + 4px);
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  text-transform: uppercase;
  opacity: 0.5;

  .hidden:not(.pressed) & {
    opacity: 0;
  }
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 14px;
  height: 14px;
  will-change: transform;

  & path {
    fill: none;
    stroke: var(--color-black);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
}

.correct circle {
  fill: var(--color-green);
}

.wrong circle {
  fill: var(--color-red);
}

.pop-up-enter-active {
  animation: pop-up-enter 0.3s;
}

.pop-up-leave-active {
  animation: pop-up-leave 0.2s;
}

@keyframes pop-up-enter {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }

  40% {
    transform: scale(1.15);
    opacity: 1;
  }

  100% {
    transform: scale(1);
  }
}

@keyframes pop-up-leave {
  0% {
    transform: scale(1);
    opacity: 1;
  }

  100% {
    transform: scale(0.8);
    opacity: 0;
  }
}
</style>
