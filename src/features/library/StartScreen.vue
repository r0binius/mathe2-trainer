<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';

import BaseIcon from '@/components/BaseIcon.vue';
import GroupedList from '@/components/GroupedList.vue';
import ListSection from '@/components/ListSection.vue';
import PageLayout from '@/components/PageLayout.vue';
import { useSpatialNav } from '@/composables/useSpatialNav';
import type { SummaryContext } from '@/domain/progress/summary';
import { summarizeApp } from '@/domain/progress/summary';
import type { AppDefinition } from '@/domain/shortcuts/types';
import { useText } from '@/i18n';
import { toReview } from '@/routes';

import { logoOf } from './logos';

const props = defineProps<{
  /** Every app Mouseless teaches. */
  apps: readonly AppDefinition[];
  /** What progress is summarized with. */
  context: SummaryContext;
}>();

const text = useText();
const nav = useTemplateRef<HTMLElement>('nav');

useSpatialNav(() => nav.value);

/** The apps with shortcuts due for review today, most due first. */
const due = computed(() =>
  props.apps
    .map((app) => summarizeApp(app, props.context))
    .filter((summary) => summary.due > 0)
    .toSorted((first, second) => second.due - first.due),
);
</script>

<template>
  <PageLayout>
    <nav ref="nav" class="start">
      <p class="hint">{{ text.ui('library.choose') }}</p>

      <ListSection v-if="due.length > 0" class="due" :title="text.ui('library.dueToday')">
        <GroupedList>
          <RouterLink
            v-for="summary in due"
            :key="summary.app.id"
            class="row"
            :to="toReview(summary.app.id)"
          >
            <img class="logo" :src="logoOf(summary.app.id)" alt="" />
            <span class="title truncate">{{ text.appTitle(summary.app) }}</span>
            <span class="count">{{ text.ui('library.due', { n: summary.due }) }}</span>
            <BaseIcon class="arrow" name="chevronRight" :size="12" />
          </RouterLink>
        </GroupedList>
      </ListSection>
    </nav>
  </PageLayout>
</template>

<style scoped>
.start {
  max-width: 420px;
  margin: 0 auto;
  padding-top: 64px;
}

.hint {
  color: var(--color-label-secondary);
  font-size: 15px;
  text-align: center;
}

.due {
  margin-top: 40px;
}

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

.logo {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.title {
  flex: 1 1 auto;
}

.count {
  color: var(--color-label-secondary);
}

.arrow {
  color: var(--color-label-tertiary);
}
</style>
