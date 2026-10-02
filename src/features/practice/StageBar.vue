<script setup lang="ts">
import type { LearnStage } from '@/domain/practice/learn';

defineProps<{
  /** How far each shortcut of the session got, in the session's order. */
  stages: readonly LearnStage[];
}>();
</script>

<template>
  <!-- The footer says the same in words, so VoiceOver skips the bar. -->
  <div class="stages" aria-hidden="true">
    <span v-for="(stage, index) in stages" :key="index" class="stage" :class="stage" />
  </div>
</template>

<style scoped>
/* One segment per shortcut: a track while unseen, due once trained, learned once recalled. */
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
