<script setup lang="ts">
import { computed } from 'vue';

import BaseButton from '@/components/BaseButton.vue';
import TextProgress from '@/components/TextProgress.vue';
import { usePracticeSession } from '@/composables/usePracticeSession';
import type { Deck, Topic } from '@/domain/content/types';
import { learnPool, learnStrategy, stepOf } from '@/domain/practice/learn';
import { learningOf } from '@/domain/progress/summary';
import SyncHint from '@/features/settings/SyncHint.vue';
import { deckTitles } from '@/labels';
import { toDeck, toTopic } from '@/routes';
import { useProgressStore } from '@/stores/progress';

import PracticeStage from './PracticeStage.vue';

const { topic, deck } = defineProps<{
  /** The topic whose deck is learned. */
  topic: Topic;
  /** The deck to learn. */
  deck: Deck;
}>();

const emit = defineEmits<{
  /** Learn the deck once more, with a fresh session. */
  restart: [];
}>();

const store = useProgressStore();
// The pool starts from the progress at this moment; the session then owns it.
const practice = usePracticeSession(
  learnStrategy,
  learnPool(deck.items, learningOf(deck.items, store.progress)),
);

const entries = computed(() => practice.session.value.pool.entries);
const steps = computed(() => entries.value.map(stepOf));
const learned = computed(() => entries.value.filter(({ stage }) => stage === 'learned').length);
</script>

<template>
  <div class="screen">
    <PracticeStage
      v-if="practice.session.value.phase !== 'finished'"
      :practice="practice"
      :steps="steps"
      :context="`${topic.title} · ${deckTitles[deck.id]} · Lernen`"
      :grades="['again', 'good']"
      :back="toDeck(topic.id, deck.id)"
    >
      <template #progress>
        <TextProgress :value="learned" :max="entries.length" /> gelernt
      </template>
    </PracticeStage>

    <div v-else class="done">
      <p class="caption">{{ topic.title }} · {{ deckTitles[deck.id] }}</p>
      <h1 class="headline">Geschafft.</h1>
      <p class="text">
        {{ learned }} von {{ entries.length }} sitzen. Was du heute gewusst hast, legt dir der
        Trainer in ein paar Tagen wieder vor – kurz bevor du es vergisst.
      </p>
      <SyncHint />
      <div class="action-bar">
        <RouterLink v-slot="{ navigate }" :to="toTopic(topic.id)" custom>
          <BaseButton variant="accent" size="large" @click="navigate">Zum Kapitel</BaseButton>
        </RouterLink>
        <BaseButton size="large" @click="emit('restart')">Noch einmal lernen</BaseButton>
      </div>
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
