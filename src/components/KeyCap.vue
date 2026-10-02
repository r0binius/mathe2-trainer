<script setup lang="ts">
import type { KeyLabel } from '@/domain/keyboard/labels';

import ResultBadge from './ResultBadge.vue';

defineProps<{
  /** What the key shows. */
  label: KeyLabel;
  /** Whether the key is being tested: its outline is dashed and its label hidden until pressed. */
  hidden?: boolean;
  /** Whether the key is down, or shown as pressed: the keycap pops up over its outline. */
  pressed?: boolean;
  /** Whether pressing it was right, shown as a badge; no badge while undecided. */
  result?: 'correct' | 'wrong' | undefined;
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
  min-width: 56px;
  height: 56px;
  padding: 0 12px;
  border-radius: var(--radius-key);
  font-family: var(--font-mono);
  font-size: 24px;
}

/* Where the key goes: a shallow well, dashed while the key is being asked for. */
.outline {
  border: 1.5px solid var(--color-border);
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

/* The key itself, raised above its well like a key on a Mac keyboard. */
.cap {
  position: absolute;
  inset: 0;
  background-color: var(--color-raised);
  box-shadow:
    0 0 0 0.5px var(--color-key-edge),
    0 2px 0 var(--color-key-edge),
    0 3px 6px rgb(0 0 0 / 12%);
  color: var(--color-text);
  will-change: transform;
}

.name {
  position: absolute;
  top: calc(100% + 10px);
  left: -2px;
  width: calc(100% + 4px);
  color: var(--color-text-secondary);
  font-size: 11px;
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
