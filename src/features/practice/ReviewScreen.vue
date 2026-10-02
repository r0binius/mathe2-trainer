<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import BackButton from '@/components/BackButton.vue';
import PageLayout from '@/components/PageLayout.vue';
import TextProgress from '@/components/TextProgress.vue';
import { appPracticeItems, reviewItems } from '@/domain/practice/items';
import type { LearnStep } from '@/domain/practice/learn';
import { reviewPool, reviewStrategy } from '@/domain/practice/review';
import type { SummaryContext } from '@/domain/progress/summary';
import { dueCards } from '@/domain/scheduling/scheduler';
import type { AppDefinition } from '@/domain/shortcuts/types';
import { useText } from '@/i18n';
import { toApp } from '@/routes';

import PracticeStage from './PracticeStage.vue';
import { usePracticeScreen } from './usePracticeScreen';

const props = defineProps<{
  /** The app whose due shortcuts are reviewed. */
  app: AppDefinition;
  /** The layout, policy and stored cards the review starts from. */
  context: SummaryContext;
}>();

const router = useRouter();
const text = useText();
const { layout, progress, endOfToday } = props.context;

// The queue is what's due when the review starts; a card forgotten during it goes to the back.
const due = reviewItems(
  dueCards(progress.cards, layout, endOfToday),
  appPracticeItems(props.app, props.context),
);

const [{ session, held, saveFailed }, { skip, forget }] = usePracticeScreen(
  { strategy: reviewStrategy, pool: reviewPool(due), target: { appId: props.app.id, layout } },
  {
    context: () => props.context,
    leave: () => {
      void router.push(toApp(props.app.id));
    },
  },
);

const done = computed(() => session.value.pool.done);

/** The review as a bar: the reviewed cards as learned, the rest still to come. */
const steps = computed(() =>
  due.map((_, index): LearnStep => (index < done.value ? 'learned' : 'unseen')),
);
</script>

<template>
  <PageLayout>
    <template #start>
      <BackButton :to="toApp(app.id)" :label="text.ui('review.back')" />
    </template>

    <PracticeStage
      :app-id="app.id"
      :session="session"
      :held="held"
      :save-failed="saveFailed"
      :steps="steps"
      :context="[text.appTitle(app), text.ui('review.title')]"
      @skip="skip"
      @forget="forget"
    >
      <template #progress>
        <TextProgress :value="done" :max="due.length" />
      </template>
    </PracticeStage>
  </PageLayout>
</template>
