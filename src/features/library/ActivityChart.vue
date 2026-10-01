<script setup lang="ts">
import { computed } from 'vue';

import { useText } from '@/i18n';

const { activity } = defineProps<{
  /** Reviews per day, oldest first, today last. */
  activity: readonly number[];
}>();

const text = useText();

const total = computed(() => activity.reduce((sum, reviews) => sum + reviews, 0));
const peak = computed(() => Math.max(0, ...activity));

/** Each day's bar: its height as a share of the peak, and what it says on hover and to VoiceOver. */
const days = computed(() =>
  activity.map((reviews, index) => ({
    reviews,
    height: peak.value === 0 ? 0 : reviews / peak.value,
    isPeak: reviews > 0 && reviews === peak.value && index === activity.lastIndexOf(peak.value),
    label: text.ui('overview.reviewsOn', {
      when: text.inDays(index - activity.length + 1),
      n: reviews,
    }),
  })),
);
</script>

<template>
  <figure class="chart">
    <!-- One bar per day on a shared baseline; only the most recent peak carries its number. -->
    <div class="bars" role="img" :aria-label="text.count('overview.activityLabel', total)">
      <div v-for="(day, index) in days" :key="index" class="day" :title="day.label">
        <span v-if="day.isPeak" class="peak">{{ day.reviews }}</span>
        <div v-if="day.reviews > 0" class="bar" :style="{ height: `${day.height * 100}%` }" />
      </div>
    </div>
    <figcaption class="axis" aria-hidden="true">
      <span>{{ text.inDays(1 - activity.length) }}</span>
      <span>{{ text.inDays(0) }}</span>
    </figcaption>
    <ol class="visually-hidden">
      <li v-for="(day, index) in days" :key="index">{{ day.label }}</li>
    </ol>
  </figure>
</template>

<style scoped>
.bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 72px;
  padding-top: 16px;
  border-bottom: 1px solid var(--color-separator);
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
  max-width: 24px;
  min-height: 2px;
  border-radius: 4px 4px 0 0;
  background-color: var(--color-accent);
}

/* The peak's number sits on its cap, in the text colour, not the bar's. */
.peak {
  position: absolute;
  bottom: 100%;
  color: var(--color-label-secondary);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.axis {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  color: var(--color-label-secondary);
  font-size: 11px;
}
</style>
