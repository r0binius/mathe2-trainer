<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import BaseButton from '@/components/BaseButton.vue';
import PageLayout from '@/components/PageLayout.vue';
import TextProgress from '@/components/TextProgress.vue';
import { usePracticeSession } from '@/composables/usePracticeSession';
import { practiceItems } from '@/domain/practice/items';
import { learnPool, learnStrategy } from '@/domain/practice/learn';
import { setProgressOf } from '@/domain/progress/storedProgress';
import type { SummaryContext } from '@/domain/progress/summary';
import type { AppDefinition, ShortcutSet } from '@/domain/shortcuts/types';
import { useText } from '@/i18n';
import { toSet } from '@/routes';
import { useProgressStore } from '@/stores/progress';

import PracticeStage from './PracticeStage.vue';
import { progressSaver } from './progressSaver';
import { useSessionExit } from './useSessionExit';

const props = defineProps<{
  /** The app the set belongs to. */
  app: AppDefinition;
  /** The set to learn. */
  set: ShortcutSet;
  /** The layout, policy and stored progress the session starts from. */
  context: SummaryContext;
}>();

const router = useRouter();
const progressStore = useProgressStore();
const text = useText();
const target = { appId: props.app.id, setId: props.set.id, layout: props.context.layout };

// The session starts from the progress as it is now, and owns it from then on.
const [{ session, held, saveFailed }, { skip, forget }] = usePracticeSession(
  learnStrategy,
  learnPool(
    practiceItems(props.app.id, props.set, props.context),
    setProgressOf(props.context.progress, target),
  ),
  {
    keymap: () => props.context.keymap,
    save: progressSaver(progressStore, target, Date.now),
    now: Date.now,
    random: Math.random,
  },
);

const stages = computed(() => session.value.pool.entries.map(({ stage }) => stage));
const learned = computed(() => stages.value.filter((stage) => stage === 'learned').length);

/** The learned count to announce, while its message shows. */
const announced = ref<number>();

watch(learned, (count) => {
  announced.value = count;
});

useSessionExit(
  () => session.value,
  () => `${String(progressStore.resets)}/${props.context.layout}`,
  () => {
    void router.push(toSet(props.app.id, props.set.id));
  },
);
</script>

<template>
  <PageLayout>
    <template #start>
      <BaseButton
        variant="toolbar"
        icon="chevronLeft"
        :label="text.ui('learn.back')"
        @click="router.push(toSet(app.id, set.id))"
      />
    </template>

    <PracticeStage
      :app-id="app.id"
      :session="session"
      :held="held"
      :save-failed="saveFailed"
      :stages="stages"
      :context="[text.appTitle(app), text.app(app.id, set.title), text.ui('learn.title')]"
      @skip="skip"
      @forget="forget"
    >
      <template #progress>
        <TextProgress :value="learned" :max="stages.length" />
        <span
          v-if="announced !== undefined"
          :key="announced"
          class="announcement"
          @animationend="announced = undefined"
        >
          {{ text.ui('learn.mastered', { n: announced }) }}
        </span>
      </template>
    </PracticeStage>
  </PageLayout>
</template>

<style scoped>
/* Shows for three seconds, then fades; its end removes it. */
.announcement {
  animation: announce 3s both;
}

@keyframes announce {
  0% {
    transform: translateX(-8px);
    opacity: 0;
  }

  7%,
  93% {
    transform: none;
    opacity: 1;
  }

  100% {
    transform: translateX(8px);
    opacity: 0;
  }
}
</style>
