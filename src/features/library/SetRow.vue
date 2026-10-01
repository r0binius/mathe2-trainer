<script setup lang="ts">
import CircleProgress from '@/components/CircleProgress.vue';
import NavigationRow from '@/components/NavigationRow.vue';
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
  <NavigationRow :to="toSet(appId, summary.set.id)">
    {{ text.app(appId, summary.set.title) }}
    <template #meta>
      <span v-if="summary.completed" class="completed">
        {{ summary.items.length }}
        <ResultBadge result="correct" />
      </span>
      <template v-else-if="summary.learned.length > 0">
        <TextProgress :value="summary.learned.length" :max="summary.items.length" />
        <CircleProgress :value="summary.learned.length" :max="summary.items.length" />
      </template>
      <template v-else>{{ summary.items.length }}</template>
    </template>
  </NavigationRow>
</template>

<style scoped>
.completed {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
