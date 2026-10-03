<script setup lang="ts">
import { computed } from 'vue';

import BaseButton from '@/components/BaseButton.vue';
import CircleProgress from '@/components/CircleProgress.vue';
import GroupedList from '@/components/GroupedList.vue';
import LinkRow from '@/components/LinkRow.vue';
import ScreenHeading from '@/components/ScreenHeading.vue';
import TextProgress from '@/components/TextProgress.vue';
import { topicItems } from '@/domain/content/lookup';
import type { Topic } from '@/domain/content/types';
import { dueItems, tallyOf } from '@/domain/progress/summary';
import { deckTitles } from '@/labels';
import { toDeck, toReview } from '@/routes';
import { useProgressStore } from '@/stores/progress';

const { topic } = defineProps<{
  /** The topic to show. */
  topic: Topic;
}>();

const store = useProgressStore();
const due = computed(() => dueItems(topicItems(topic), store.progress, store.endOfToday).length);
</script>

<template>
  <div class="topic">
    <ScreenHeading :title="topic.title">
      <template #meta>Kapitel {{ topic.chapter }} · {{ topic.summary }}</template>
      <template #action>
        <RouterLink v-if="due > 0" v-slot="{ navigate }" :to="toReview(topic.id)" custom>
          <BaseButton variant="accent" size="large" @click="navigate">
            {{ due }} wiederholen
          </BaseButton>
        </RouterLink>
      </template>
    </ScreenHeading>

    <GroupedList>
      <LinkRow v-for="deck in topic.decks" :key="deck.id" :to="toDeck(topic.id, deck.id)">
        <template #leading>
          <CircleProgress
            :value="tallyOf(deck.items, store.progress).learned"
            :max="deck.items.length"
            :size="18"
          />
        </template>
        {{ deckTitles[deck.id] }}
        <template #meta>
          <TextProgress
            :value="tallyOf(deck.items, store.progress).learned"
            :max="deck.items.length"
          />
        </template>
      </LinkRow>
    </GroupedList>

    <p class="advice">
      Reihenfolge, die sich bewährt: erst die Definitionen, dann die Sätze, dann „Wahr oder falsch“
      zum Prüfen des Verständnisses – und zuletzt die Aufgaben mit Stift und Papier.
    </p>
  </div>
</template>

<style scoped>
.topic {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.advice {
  max-width: 60ch;
  color: var(--color-text-secondary);
  font-size: 14px;
}
</style>
