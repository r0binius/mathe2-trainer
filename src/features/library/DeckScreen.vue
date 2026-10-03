<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import BaseButton from '@/components/BaseButton.vue';
import ItemCard from '@/components/ItemCard.vue';
import RichText from '@/components/RichText.vue';
import ScreenHeading from '@/components/ScreenHeading.vue';
import { useHotkeys } from '@/composables/useHotkeys';
import { headlineOf } from '@/domain/content/lookup';
import type { Deck, Topic } from '@/domain/content/types';
import { nextReviewIn, tallyOf } from '@/domain/progress/summary';
import { deckTitles, inDays } from '@/labels';
import { toLearn, toTopic } from '@/routes';
import { useProgressStore } from '@/stores/progress';

const { topic, deck } = defineProps<{
  /** The topic the deck belongs to. */
  topic: Topic;
  /** The deck whose items are listed. */
  deck: Deck;
}>();

const store = useProgressStore();
const router = useRouter();
const tally = computed(() => tallyOf(deck.items, store.progress));

const stageLabels = { learned: 'gelernt', trained: 'in Arbeit', unseen: 'neu' } as const;

const rows = computed(() =>
  deck.items.map((item) => {
    const stage = store.progress.stages[item.id] ?? 'unseen';
    const review = nextReviewIn(item.id, store.progress, store.endOfToday);

    return {
      item,
      stage,
      status:
        review === undefined
          ? stageLabels[stage]
          : `${stageLabels[stage]}, wieder ${inDays(review)}`,
    };
  }),
);

useHotkeys(() => ({
  l: () => {
    void router.push(toLearn(topic.id, deck.id));
  },
  Escape: () => {
    void router.push(toTopic(topic.id));
  },
}));
</script>

<template>
  <div class="deck">
    <ScreenHeading :title="deckTitles[deck.id]">
      <template #meta>
        <RouterLink class="crumb" :to="toTopic(topic.id)">{{ topic.title }}</RouterLink> ·
        {{ tally.learned }} von {{ tally.total }} gelernt
      </template>
      <template #action>
        <RouterLink v-slot="{ navigate }" :to="toLearn(topic.id, deck.id)" custom>
          <BaseButton variant="accent" size="large" @click="navigate">
            {{ tally.learned === tally.total ? 'Noch einmal lernen' : 'Lernen' }}
          </BaseButton>
        </RouterLink>
      </template>
    </ScreenHeading>

    <ul class="items">
      <li v-for="row in rows" :key="row.item.id">
        <details class="entry">
          <summary class="summary">
            <span class="dot" :class="row.stage" aria-hidden="true" />
            <RichText class="headline" :source="headlineOf(row.item)" />
            <span class="status">{{ row.status }}</span>
          </summary>
          <ItemCard class="body" :item="row.item" />
        </details>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.deck {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.crumb {
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

.items {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-box);
  background-color: var(--color-box);
  list-style: none;

  > li + li {
    border-top: 1px solid var(--color-border);
  }
}

.summary {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  list-style: none;

  &::-webkit-details-marker {
    display: none;
  }

  &:hover {
    background-color: var(--color-fill);
  }
}

.headline {
  flex: 1 1 auto;
  min-width: 0;
}

/* How far the item got: a ring while new, due-colored while in progress, filled once learned. */
.dot {
  flex: none;
  width: 9px;
  height: 9px;
  border: 1.5px solid var(--color-text-tertiary);
  border-radius: 50%;

  &.trained {
    border-color: var(--color-due);
    background-color: var(--color-due);
  }

  &.learned {
    border-color: var(--color-learned);
    background-color: var(--color-learned);
  }
}

.status {
  flex: none;
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
  font-size: 11px;
}

.body {
  padding: 4px 12px 14px 31px;
}

@media (max-width: 560px) {
  .status {
    display: none;
  }
}
</style>
