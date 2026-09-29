<script setup lang="ts">
import CircleProgress from '@/components/CircleProgress.vue';
import TextProgress from '@/components/TextProgress.vue';
import type { AppSummary } from '@/domain/progress/summary';
import { useText } from '@/i18n';
import { toApp } from '@/routes';

import { logoOf } from './logos';

defineProps<{
  /** The app and its progress. */
  summary: AppSummary;
}>();

const text = useText();
</script>

<template>
  <RouterLink class="card" :to="toApp(summary.app.id)">
    <img class="logo" :src="logoOf(summary.app.id)" alt="" />
    <span v-if="summary.due > 0" class="due">{{ text.ui('library.due', { n: summary.due }) }}</span>
    <span class="title truncate">{{ text.appTitle(summary.app) }}</span>
    <span class="meta">
      <template v-if="summary.learned > 0">
        <span>
          <TextProgress :value="summary.learned" :max="summary.shortcuts" />
          {{ text.ui('library.mastered') }}
        </span>
        <CircleProgress :value="summary.learned" :max="summary.shortcuts" />
      </template>
      <template v-else>{{ text.count('library.shortcuts', summary.shortcuts) }}</template>
    </span>
  </RouterLink>
</template>

<style scoped>
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 20px;
  border-radius: 12px;
  background-color: var(--color-surface);
  transition: background-color 0.2s ease;

  &:hover,
  &:focus-visible {
    background-color: var(--color-surface-hover);
  }
}

.logo {
  width: 40px;
  height: 40px;
  margin-bottom: 36px;
  object-fit: contain;
  object-position: 0 0;
}

.due {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 3px 8px;
  border-radius: 10px;
  background-color: var(--color-yellow);
  color: var(--color-black);
  font-size: 12px;
  font-weight: 700;
}

.title {
  margin-bottom: 6px;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 600;
}
</style>
