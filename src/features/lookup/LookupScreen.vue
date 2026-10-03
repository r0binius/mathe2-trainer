<script setup lang="ts">
import { computed, shallowRef, useTemplateRef, watch } from 'vue';

import BaseButton from '@/components/BaseButton.vue';
import ItemCard from '@/components/ItemCard.vue';
import RichText from '@/components/RichText.vue';
import ScreenHeading from '@/components/ScreenHeading.vue';
import { useHotkeys } from '@/composables/useHotkeys';
import { headlineOf, locateAll, search } from '@/domain/content/lookup';
import type { DeckId, Topic } from '@/domain/content/types';
import { deckIds } from '@/domain/content/types';
import { deckTitles } from '@/labels';

const { topics } = defineProps<{
  /** Every topic to look things up in. */
  topics: readonly Topic[];
}>();

const all = locateAll(topics);
const query = shallowRef('');
const topicId = shallowRef('');
const deck = shallowRef<DeckId | ''>('definitions');
const pageSize = 25;
const shown = shallowRef(pageSize);
const field = useTemplateRef<HTMLInputElement>('field');

const results = computed(() =>
  search(all, {
    query: query.value,
    topicId: topicId.value === '' ? undefined : topicId.value,
    deck: deck.value === '' ? undefined : deck.value,
  }),
);

watch([query, topicId, deck], () => {
  shown.value = pageSize;
});

useHotkeys(() => ({
  '/': () => {
    field.value?.focus();
  },
  Escape: () => {
    field.value?.blur();
  },
}));
</script>

<template>
  <div class="lookup">
    <ScreenHeading title="Nachschlagen">
      <template #meta
        >Alle Definitionen, Sätze, Aussagen und Aufgaben – zum Suchen statt Blättern.</template
      >
    </ScreenHeading>

    <div class="filters">
      <input
        ref="field"
        v-model="query"
        class="field search"
        type="search"
        placeholder="Suchen, z. B. Cauchy oder Quotientenkriterium ( / )"
        aria-label="Suchen"
      />
      <select v-model="topicId" class="field" aria-label="Kapitel">
        <option value="">Alle Kapitel</option>
        <option v-for="topic in topics" :key="topic.id" :value="topic.id">
          {{ topic.chapter }} {{ topic.title }}
        </option>
      </select>
      <select v-model="deck" class="field" aria-label="Art">
        <option value="">Alles</option>
        <option v-for="id in deckIds" :key="id" :value="id">{{ deckTitles[id] }}</option>
      </select>
    </div>

    <p class="count caption">{{ results.length }} Treffer</p>

    <p v-if="results.length === 0" class="empty">
      Nichts gefunden. Probier ein kürzeres Wort oder nimm die Filter heraus.
    </p>

    <ul class="results">
      <li v-for="{ item, topic } in results.slice(0, shown)" :key="item.id" class="result">
        <p class="where caption">{{ topic.chapter }} · {{ topic.title }}</p>
        <h2 v-if="item.kind !== 'claim'" class="title"><RichText :source="headlineOf(item)" /></h2>
        <ItemCard :item="item" />
      </li>
    </ul>

    <BaseButton v-if="results.length > shown" size="large" @click="shown += pageSize">
      Weitere {{ Math.min(pageSize, results.length - shown) }} anzeigen
    </BaseButton>
  </div>
</template>

<style scoped>
.lookup {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.field {
  min-height: 36px;
  max-width: 100%;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background-color: var(--color-box);
  color: inherit;
  font: inherit;
}

.search {
  flex: 1 1 260px;
}

.empty {
  color: var(--color-text-secondary);
}

.results {
  display: flex;
  flex-direction: column;
  gap: 10px;
  list-style: none;
}

.result {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-box);
  background-color: var(--color-box);
}

.title {
  font-size: 17px;
  font-weight: 600;
}
</style>
