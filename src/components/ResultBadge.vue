<script setup lang="ts">
defineProps<{
  /** Whether it went right (a green check) or wrong (a red cross). */
  result: 'correct' | 'wrong';
}>();
</script>

<template>
  <svg class="badge" :class="result" viewBox="0 0 14 14" aria-hidden="true">
    <circle cx="7" cy="7" r="7" />
    <path v-if="result === 'correct'" d="M9.625 4.375L5.8587 9.625L4.375 8.1413" />
    <path v-else d="M4.375 4.375L9.625 9.625M9.625 4.375L4.375 9.625" />
  </svg>
</template>

<style scoped>
.badge {
  width: 14px;
  height: 14px;
  flex: none;
}

path {
  fill: none;
  stroke: var(--color-black);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.correct circle {
  fill: var(--color-green);
}

.wrong circle {
  fill: var(--color-red);
}
</style>
