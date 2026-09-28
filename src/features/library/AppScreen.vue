<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import BaseButton from '@/components/BaseButton.vue';
import ListSection from '@/components/ListSection.vue';
import PageLayout from '@/components/PageLayout.vue';
import type { SummaryContext } from '@/domain/progress/summary';
import { recentFirst, summarizeApp, summarizeSet } from '@/domain/progress/summary';
import { daysUntil } from '@/domain/scheduling/days';
import type { AppDefinition } from '@/domain/shortcuts/types';
import { useText } from '@/i18n';
import { toLibrary, toReview } from '@/router';

import { logoOf } from './logos';
import SetRow from './SetRow.vue';

const props = defineProps<{
  /** The app whose sets are shown. */
  app: AppDefinition;
  /** What progress is summarized with. */
  context: SummaryContext;
}>();

const router = useRouter();
const text = useText();

const summary = computed(() => summarizeApp(props.app, props.context));
const sets = computed(() =>
  props.app.sets.map((set) => summarizeSet(props.app.id, set, props.context)),
);
const recent = computed(() => recentFirst(sets.value));
const others = computed(() => sets.value.filter((set) => set.practicedAt === undefined));

/** When the next review is, while none is due today. */
const nextReview = computed(() => {
  const { due, nextDueAt } = summary.value;

  return due === 0 && nextDueAt !== undefined
    ? text.ui('app.nextReview', {
        when: text.inDays(daysUntil(nextDueAt, props.context.endOfToday)),
      })
    : undefined;
});
</script>

<template>
  <PageLayout>
    <template #start>
      <BaseButton icon="arrowLeft" @click="router.push(toLibrary())">
        {{ text.ui('app.back') }}
      </BaseButton>
    </template>

    <header class="header">
      <img class="logo" :src="logoOf(app.id)" alt="" />
      <div class="heading">
        <h1 class="title truncate">{{ app.title }}</h1>
        <p v-if="nextReview !== undefined" class="meta">{{ nextReview }}</p>
      </div>
      <BaseButton
        v-if="summary.due > 0"
        variant="accent"
        size="large"
        @click="router.push(toReview(app.id))"
      >
        {{ text.ui('app.review', { n: summary.due }) }}
      </BaseButton>
    </header>

    <div class="sections">
      <ListSection v-if="recent.length > 0" :title="text.ui('library.recent')">
        <div class="rows">
          <SetRow v-for="set in recent" :key="set.set.id" :app-id="app.id" :summary="set" />
        </div>
      </ListSection>

      <ListSection v-if="others.length > 0" :title="text.ui('app.sets')">
        <div class="rows">
          <SetRow v-for="set in others" :key="set.set.id" :app-id="app.id" :summary="set" />
        </div>
      </ListSection>
    </div>
  </PageLayout>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
}

.logo {
  height: 40px;
}

.heading {
  flex: 1 1 auto;
  min-width: 0;
}

.title {
  font-size: 34px;
  font-weight: 700;
}

.meta {
  margin-top: 4px;
  color: color-mix(in srgb, var(--color-white) 50%, transparent);
  font-size: 14px;
  font-weight: 600;
}

.sections {
  display: grid;
  gap: 24px;
}

.rows {
  display: grid;
  gap: 2px;
  border-radius: 9px;
  overflow: hidden;
}
</style>
