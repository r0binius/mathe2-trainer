<script setup lang="ts">
import { computed } from 'vue';

const { activity } = defineProps<{
  /** Tests per day, oldest first, today last. */
  activity: readonly number[];
}>();

const total = computed(() => activity.reduce((sum, tests) => sum + tests, 0));
const peak = computed(() => Math.max(0, ...activity));

/** Each day's bar: its height as a share of the peak. Only the most recent peak carries its number. */
const days = computed(() =>
  activity.map((tests, index) => ({
    tests,
    height: peak.value === 0 ? 0 : tests / peak.value,
    isPeak: tests > 0 && tests === peak.value && index === activity.lastIndexOf(peak.value),
  })),
);
</script>

<template>
  <figure class="chart">
    <div
      class="bars"
      role="img"
      :aria-label="`${total} Antworten in den letzten ${activity.length} Tagen`"
    >
      <div v-for="(day, index) in days" :key="index" class="day">
        <span v-if="day.isPeak" class="peak">{{ day.tests }}</span>
        <div v-if="day.tests > 0" class="bar" :style="{ height: `${day.height * 100}%` }" />
      </div>
    </div>
    <figcaption class="axis" aria-hidden="true">
      <span>vor {{ activity.length - 1 }} Tagen</span>
      <span>heute</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.bars {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 64px;
  padding-top: 16px;
  border-bottom: 1px solid var(--color-border);
}

/* A day's slot fills its share of the width; the bar inside grows from the baseline. */
.day {
  position: relative;
  display: flex;
  flex: 1 1 0;
  justify-content: center;
  align-items: flex-end;
  height: 100%;
}

.bar {
  width: 100%;
  max-width: 28px;
  min-height: 2px;
  border-radius: 3px 3px 0 0;
  background-color: var(--color-action);
}

.peak {
  position: absolute;
  bottom: 100%;
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  font-size: 11px;
}

.axis {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
  font-size: 11px;
}
</style>
