<script setup lang="ts">
import type { LearnStep } from '@/domain/practice/learn';

defineProps<{
  /** How far each item of the session got, in the session's order. */
  steps: readonly LearnStep[];
}>();
</script>

<template>
  <!-- The footer says the same in words, so VoiceOver skips the bar. -->
  <div class="stages" aria-hidden="true">
    <span v-for="(step, index) in steps" :key="index" class="stage" :class="step" />
  </div>
</template>

<style scoped>
/* One segment per item: a track while unseen, due once trained, half learned once recalled
once, learned once recalled enough. */
.stages {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  max-width: 480px;
  margin: 0 auto;
}

.stage {
  width: 18px;
  height: 4px;
  border-radius: 2px;
  background-color: var(--color-border);
  transition: background-color 0.18s ease-out;

  &.trained {
    background-color: var(--color-due);
  }

  &.recalled {
    background-color: color-mix(in srgb, var(--color-learned) 50%, var(--color-border));
  }

  &.learned {
    background-color: var(--color-learned);
  }
}

@media (prefers-reduced-motion: reduce) {
  .stage {
    transition: none;
  }
}
</style>
