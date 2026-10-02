<script setup lang="ts">
import { computed } from 'vue';

const {
  value,
  max,
  size = 16,
} = defineProps<{
  /** How much is done. */
  value: number;
  /** How much there is to do; nothing to do shows an empty circle. */
  max: number;
  /** The diameter in pixels. */
  size?: number;
}>();

const strokeWidth = 2.5;

const center = computed(() => size / 2);
const radius = computed(() => (size - strokeWidth) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const remaining = computed(() => (max > 0 ? (max - value) / max : 1));
</script>

<template>
  <svg class="circle" :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
    <circle class="track" :r="radius" :cx="center" :cy="center" :stroke-width="strokeWidth" />
    <circle
      class="done"
      :r="radius"
      :cx="center"
      :cy="center"
      :stroke-width="strokeWidth"
      :stroke-dasharray="circumference"
      :stroke-dashoffset="remaining * circumference"
      :transform="`rotate(-90 ${center} ${center})`"
    />
  </svg>
</template>

<style scoped>
.circle {
  flex: none;
  fill: none;
}

.track {
  stroke: var(--color-border);
}

.done {
  stroke: var(--color-learned);
  transition: stroke-dashoffset 0.5s ease;
}
</style>
