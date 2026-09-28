<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';

import ListSection from '@/components/ListSection.vue';
import PageLayout from '@/components/PageLayout.vue';
import { useSpatialNav } from '@/composables/useSpatialNav';
import type { SummaryContext } from '@/domain/progress/summary';
import { groupByCategory, recentFirst, summarizeApp } from '@/domain/progress/summary';
import type { AppDefinition } from '@/domain/shortcuts/types';
import { useText } from '@/i18n';

import AppCard from './AppCard.vue';

const props = defineProps<{
  /** Every app Mouseless teaches. */
  apps: readonly AppDefinition[];
  /** What progress is summarized with. */
  context: SummaryContext;
}>();

const text = useText();
const nav = useTemplateRef<HTMLElement>('nav');

useSpatialNav(() => nav.value);
const summaries = computed(() => props.apps.map((app) => summarizeApp(app, props.context)));
const recent = computed(() => recentFirst(summaries.value));
const groups = computed(() => groupByCategory(summaries.value));
</script>

<template>
  <PageLayout>
    <nav ref="nav" class="sections">
      <ListSection v-if="recent.length > 0" :title="text.ui('library.recent')">
        <div class="grid">
          <AppCard v-for="summary in recent" :key="summary.app.id" :summary="summary" />
        </div>
      </ListSection>

      <ListSection
        v-for="group in groups"
        :key="group.category"
        :title="text.ui(`categories.${group.category}`)"
      >
        <div class="grid">
          <AppCard v-for="summary in group.apps" :key="summary.app.id" :summary="summary" />
        </div>
      </ListSection>
    </nav>
  </PageLayout>
</template>

<style scoped>
.sections {
  display: grid;
  gap: 24px;
  padding-top: 8px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
</style>
