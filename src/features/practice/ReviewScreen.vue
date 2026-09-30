<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import BaseButton from '@/components/BaseButton.vue';
import PageLayout from '@/components/PageLayout.vue';
import TextProgress from '@/components/TextProgress.vue';
import { usePracticeSession } from '@/composables/usePracticeSession';
import { appPracticeItems, reviewItems } from '@/domain/practice/items';
import { reviewPool, reviewStrategy } from '@/domain/practice/review';
import type { SummaryContext } from '@/domain/progress/summary';
import { dueCards } from '@/domain/scheduling/scheduler';
import type { AppDefinition } from '@/domain/shortcuts/types';
import { useText } from '@/i18n';
import { toApp } from '@/routes';
import { useProgressStore } from '@/stores/progress';

import PracticeStage from './PracticeStage.vue';
import { progressSaver } from './progressSaver';
import { useSessionExit } from './useSessionExit';

const props = defineProps<{
  /** The app whose due shortcuts are reviewed. */
  app: AppDefinition;
  /** The layout, policy and stored cards the review starts from. */
  context: SummaryContext;
}>();

const router = useRouter();
const progressStore = useProgressStore();
const text = useText();
const { keymap, layout, progress, endOfToday } = props.context;

// The queue is what's due when the review starts; a card forgotten during it goes to the back.
const due = reviewItems(
  dueCards(progress.cards, layout, endOfToday),
  appPracticeItems(props.app, props.context),
);

const [{ session, held, saveFailed }, { skip, forget }] = usePracticeSession(
  reviewStrategy,
  reviewPool(due),
  {
    keymap: () => keymap,
    save: progressSaver(progressStore, { appId: props.app.id, layout }, Date.now),
    now: Date.now,
    random: Math.random,
  },
);

const done = computed(() => session.value.pool.done);

useSessionExit(
  () => session.value,
  () => `${String(progressStore.resets)}/${props.context.layout}`,
  () => {
    void router.push(toApp(props.app.id));
  },
);
</script>

<template>
  <PageLayout :title="text.appTitle(app)" :subtitle="text.ui('review.title')">
    <template #start>
      <BaseButton
        variant="toolbar"
        icon="chevronLeft"
        :label="text.ui('review.back')"
        @click="router.push(toApp(app.id))"
      />
    </template>

    <PracticeStage
      :app-id="app.id"
      :session="session"
      :held="held"
      :save-failed="saveFailed"
      @skip="skip"
      @forget="forget"
    >
      <template #progress>
        <TextProgress :value="done" :max="due.length" />
      </template>
    </PracticeStage>
  </PageLayout>
</template>
