<script setup lang="ts">
import BaseIcon from '@/components/BaseIcon.vue';
import CircleProgress from '@/components/CircleProgress.vue';
import ResultBadge from '@/components/ResultBadge.vue';
import TextProgress from '@/components/TextProgress.vue';
import type { SetSummary } from '@/domain/progress/summary';
import { useText } from '@/i18n';
import { toSet } from '@/routes';

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
      <BaseIcon class="arrow" name="chevronRight" :size="12" />
    </span>
  </RouterLink>
</template>

<style scoped>
/* A row that opens its set, as a navigation row in System Settings. */
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 6px 12px;

  &:active {
    background-color: var(--color-fill);
  }
}

.title {
  flex: 1 1 auto;
}

.meta {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 8px;
  color: var(--color-label-secondary);
  font-variant-numeric: tabular-nums;
}

.completed {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.arrow {
  color: var(--color-label-tertiary);
}
</style>
