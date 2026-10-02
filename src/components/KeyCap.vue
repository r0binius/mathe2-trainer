<script setup lang="ts">
import type { KeyLabel } from '@/domain/keyboard/labels';

import type { AnswerResult } from './answerResult';
import ResultBadge from './ResultBadge.vue';

defineProps<{
  /** What the key shows. */
  label: KeyLabel;
  /** Whether the key is being tested: its outline is dashed and its label hidden until pressed. */
  hidden?: boolean;
  /** Whether the key is down, or shown as pressed: the keycap pops up over its outline. */
  pressed?: boolean;
  /** Whether pressing it was right, shown as a badge; no badge while undecided. */
  result?: AnswerResult | undefined;
}>();
</script>

<template>
  <div class="key" :class="[{ hidden, pressed }, result]">
    <div class="outline">{{ label.symbol }}</div>

    <Transition name="pop-up">
      <div v-if="pressed" class="cap">{{ label.symbol }}</div>
    </Transition>

    <div v-if="label.name !== undefined" class="name">{{ label.name }}</div>

    <Transition name="pop-up">
      <ResultBadge v-if="result !== undefined" :key="result" class="badge" :result="result" />
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
  min-width: 52px;
  height: 52px;
  padding: 0 12px;
  border-radius: var(--radius-key);
  font-family: var(--font-mono);
  font-size: 22px;
  font-weight: 500;
}

/* Where the key goes: a shallow well, dashed while the key is being asked for. */
.outline {
  border: 1px solid var(--color-border);
  background-color: var(--color-fill);
  color: var(--color-text-secondary);

  .hidden & {
    border-style: dashed;
    border-color: var(--color-text-tertiary);
    background-color: transparent;
    color: transparent;
  }

  .pressed & {
    border-color: transparent;
    background-color: transparent;
  }
}

/* The key itself: raised, with a hairline and a deeper bottom edge. Its outline turns to the
learned or mistake color once the press is judged. */
.cap {
  position: absolute;
  inset: 0;
  border: 1px solid var(--color-border);
  border-bottom: 3px solid var(--color-key-edge);
  background-color: var(--color-raised);
  color: var(--color-text);
  will-change: transform;

  .correct & {
    border-color: var(--color-learned);
    color: var(--color-learned);
  }

  .wrong & {
    border-color: var(--color-mistake);
    color: var(--color-mistake);
  }
}

.name {
  position: absolute;
  top: calc(100% + 8px);
  left: -2px;
  width: calc(100% + 4px);
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
  font-size: 10px;
  text-align: center;

  .hidden:not(.pressed) & {
    opacity: 0;
  }
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  will-change: transform;
}

.pop-up-enter-active {
  animation: pop-up-enter 0.3s;
}

.pop-up-leave-active {
  animation: pop-up-leave 0.2s;
}

@media (prefers-reduced-motion: reduce) {
  .pop-up-enter-active,
  .pop-up-leave-active {
    animation: none;
  }
}

@keyframes pop-up-enter {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }

  40% {
    transform: scale(1.08);
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
    transform: scale(0.9);
    opacity: 0;
  }
}
</style>
