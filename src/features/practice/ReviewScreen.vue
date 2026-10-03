<script setup lang="ts">
import { computed } from 'vue';

import BaseButton from '@/components/BaseButton.vue';
import TextProgress from '@/components/TextProgress.vue';
import { usePracticeSession } from '@/composables/usePracticeSession';
import { topicItems } from '@/domain/content/lookup';
import type { Topic } from '@/domain/content/types';
import { reviewPool, reviewStrategy } from '@/domain/practice/review';
import { dueItems } from '@/domain/progress/summary';
import { toOverview, toTopic } from '@/routes';
import { useProgressStore } from '@/stores/progress';

import PracticeStage from './PracticeStage.vue';

const { topics, topic } = defineProps<{
  /** Every topic, for reviewing all that's due. */
  topics: readonly Topic[];
  /** The one topic to review, or none to review them all. */
  topic?: Topic;
}>();

const store = useProgressStore();
const items = (topic === undefined ? topics : [topic]).flatMap(topicItems);
// The queue is what's due at this moment; the session then owns it.
const due = dueItems(items, store.progress, store.endOfToday);
const practice = usePracticeSession(reviewStrategy, reviewPool(due));

const done = computed(() => practice.session.value.pool.done);
const back = computed(() => (topic === undefined ? toOverview() : toTopic(topic.id)));
</script>

<template>
  <div class="screen">
    <PracticeStage
      v-if="practice.session.value.phase !== 'finished'"
      :practice="practice"
      :steps="[]"
      :context="`${topic?.title ?? 'Alle Kapitel'} · Wiederholen`"
      :grades="['again', 'hard', 'good', 'easy']"
      :back="back"
    >
      <template #progress> <TextProgress :value="done" :max="due.length" /> wiederholt </template>
    </PracticeStage>

    <div v-else class="done">
      <h1 class="headline">{{ due.length === 0 ? 'Nichts fällig.' : 'Alles wiederholt.' }}</h1>
      <p class="text">
        {{
          due.length === 0
            ? 'Heute steht keine Wiederholung an. Lerne ein neues Deck – was du dabei weißt, kommt von selbst in die Wiederholung.'
            : 'Der Trainer legt dir jede Karte wieder vor, kurz bevor du sie vergisst.'
        }}
      </p>
      <RouterLink v-slot="{ navigate }" :to="back" custom>
        <BaseButton variant="accent" size="large" @click="navigate">Zurück</BaseButton>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.screen {
  min-height: 100%;
}

.done {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  max-width: 520px;
  margin: 0 auto;
  padding-top: 12vh;
}

.headline {
  font-size: 32px;
  font-weight: 500;
}

.text {
  color: var(--color-text-secondary);
}
</style>
