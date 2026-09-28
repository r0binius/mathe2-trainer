<script setup lang="ts">
import BaseIcon from '@/components/BaseIcon.vue';
import CircleProgress from '@/components/CircleProgress.vue';
import ResultBadge from '@/components/ResultBadge.vue';
import TextProgress from '@/components/TextProgress.vue';
import type { SetSummary } from '@/domain/progress/summary';
import { useText } from '@/i18n';
import { toSet } from '@/router';

defineProps<{
  /** The app the set belongs to. */
  appId: string;
  /** The set and its progress. */
  summary: SetSummary;
}>();

const text = useText();
</script>

<template>
  <RouterLink class="row" :to="toSet(appId, summary.set.id)">
    <span class="title truncate">{{ text.app(appId, summary.set.title) }}</span>
    <span class="meta">
      <span v-if="summary.completed" class="completed">
        {{ summary.items.length }}
        <ResultBadge result="correct" />
      </span>
      <template v-else-if="summary.learned.length > 0">
        <TextProgress :value="summary.learned.length" :max="summary.items.length" />
        <CircleProgress :value="summary.learned.length" :max="summary.items.length" />
      </template>
      <template v-else>{{ summary.items.length }}</template>
      <BaseIcon class="arrow" name="arrowRight" />
    </span>
  </RouterLink>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  background-color: color-mix(in srgb, var(--color-white) 8%, transparent);
  transition: background-color 0.2s ease;

  &:hover,
  &:focus-visible {
    background-color: color-mix(in srgb, var(--color-white) 12%, transparent);
  }
}

.title {
  flex: 1 1 auto;
  font-size: 18px;
  font-weight: 700;
}

.meta {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 8px;
  color: color-mix(in srgb, var(--color-white) 50%, transparent);
  font-size: 12px;
  font-weight: 700;
}

.completed {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-green);
}

.arrow {
  margin-left: 4px;
  opacity: 0.5;
  transition: opacity 0.2s ease;

  .row:hover & {
    opacity: 1;
  }
}
</style>
