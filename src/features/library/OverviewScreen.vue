<script setup lang="ts">
import { computed } from 'vue';

import BaseButton from '@/components/BaseButton.vue';
import CircleProgress from '@/components/CircleProgress.vue';
import GroupedList from '@/components/GroupedList.vue';
import LinkRow from '@/components/LinkRow.vue';
import ListSection from '@/components/ListSection.vue';
import RichText from '@/components/RichText.vue';
import TextProgress from '@/components/TextProgress.vue';
import { headlineOf, locateAll, topicItems } from '@/domain/content/lookup';
import type { Topic } from '@/domain/content/types';
import { activityOf, dueItems, streakOf, tallyOf, weakSpots } from '@/domain/progress/summary';
import SyncHint from '@/features/settings/SyncHint.vue';
import { deckTitles } from '@/labels';
import { toDeck, toExam, toLearn, toReview, toTopic } from '@/routes';
import { useProgressStore } from '@/stores/progress';

import ActivityChart from './ActivityChart.vue';

const { topics } = defineProps<{
  /** Every topic of the lecture. */
  topics: readonly Topic[];
}>();

const store = useProgressStore();
const located = locateAll(topics);
const items = located.map(({ item }) => item);

const tally = computed(() => tallyOf(items, store.progress));
const due = computed(() => dueItems(items, store.progress, store.endOfToday).length);
const streak = computed(() => streakOf(store.progress.log, store.now));
const activity = computed(() => activityOf(store.progress.log, store.now, 14));
const weak = computed(() =>
  weakSpots(items, store.progress, 5).map((spot) => ({
    ...spot,
    where: located.find(({ item }) => item.id === spot.item.id),
  })),
);
const lastExam = computed(() => store.progress.exams.at(-1));

/** The first deck, in the lecture's order, that isn't learned completely: where to go on. */
const next = computed(() =>
  topics
    .flatMap((topic) => topic.decks.map((deck) => ({ topic, deck })))
    .find(({ deck }) => {
      const { learned, total } = tallyOf(deck.items, store.progress);

      return learned < total;
    }),
);
</script>

<template>
  <div class="overview">
    <SyncHint />

    <header class="hero">
      <p class="caption">Mathematik 2 · Kapitel 7 bis 13</p>
      <h1 class="headline">
        <template v-if="due > 0"
          >{{ due }} {{ due === 1 ? 'Karte ist' : 'Karten sind' }} heute fällig.</template
        >
        <template v-else-if="tally.learned === 0">Fang mit den Definitionen an.</template>
        <template v-else>Heute ist nichts fällig. Zeit für Neues.</template>
      </h1>
      <div class="actions">
        <RouterLink v-if="due > 0" v-slot="{ navigate }" :to="toReview()" custom>
          <BaseButton variant="accent" size="large" @click="navigate">Jetzt wiederholen</BaseButton>
        </RouterLink>
        <RouterLink
          v-if="next !== undefined"
          v-slot="{ navigate }"
          :to="toLearn(next.topic.id, next.deck.id)"
          custom
        >
          <BaseButton :variant="due > 0 ? 'neutral' : 'accent'" size="large" @click="navigate">
            Weiter lernen: {{ next.topic.title }}, {{ deckTitles[next.deck.id] }}
          </BaseButton>
        </RouterLink>
        <RouterLink v-slot="{ navigate }" :to="toExam()" custom>
          <BaseButton size="large" @click="navigate">Prüfung simulieren</BaseButton>
        </RouterLink>
      </div>
    </header>

    <dl class="figures">
      <div class="figure">
        <dt class="caption">Gelernt</dt>
        <dd><TextProgress :value="tally.learned" :max="tally.total" /></dd>
      </div>
      <div class="figure">
        <dt class="caption">In Arbeit</dt>
        <dd class="mono">{{ tally.trained }}</dd>
      </div>
      <div class="figure">
        <dt class="caption">Serie</dt>
        <dd class="mono">{{ streak }} {{ streak === 1 ? 'Tag' : 'Tage' }}</dd>
      </div>
      <div v-if="lastExam !== undefined" class="figure">
        <dt class="caption">Letzte Prüfung</dt>
        <dd class="mono">{{ Math.round((lastExam.points / lastExam.max) * 100) }} %</dd>
      </div>
    </dl>

    <ListSection title="Kapitel">
      <GroupedList>
        <LinkRow v-for="topic in topics" :key="topic.id" :to="toTopic(topic.id)">
          <template #leading>
            <CircleProgress
              :value="tallyOf(topicItems(topic), store.progress).learned"
              :max="topicItems(topic).length"
              :size="18"
            />
          </template>
          <span class="chapter">{{ topic.chapter }}</span> {{ topic.title }}
          <template #meta>
            <span
              v-if="dueItems(topicItems(topic), store.progress, store.endOfToday).length > 0"
              class="due"
            >
              {{ dueItems(topicItems(topic), store.progress, store.endOfToday).length }} fällig
            </span>
            <TextProgress
              :value="tallyOf(topicItems(topic), store.progress).learned"
              :max="topicItems(topic).length"
            />
          </template>
        </LinkRow>
      </GroupedList>
    </ListSection>

    <ListSection title="Aktivität der letzten 14 Tage">
      <ActivityChart :activity="activity" />
    </ListSection>

    <ListSection v-if="weak.length > 0" title="Das sitzt noch nicht">
      <GroupedList>
        <template v-for="spot in weak" :key="spot.item.id">
          <LinkRow
            v-if="spot.where !== undefined"
            :to="toDeck(spot.where.topic.id, spot.where.deck)"
          >
            <RichText :source="headlineOf(spot.item)" />
            <template #meta>{{ spot.misses }} von {{ spot.tests }} falsch</template>
          </LinkRow>
        </template>
      </GroupedList>
    </ListSection>
  </div>
</template>

<style scoped>
.overview {
  display: flex;
  flex-direction: column;
  gap: 26px;
}

.hero {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* The one large line: what to do today. */
.headline {
  max-width: 18em;
  font-size: clamp(26px, 5vw, 38px);
  font-weight: 500;
  letter-spacing: -0.015em;
  line-height: 1.15;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.figures {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 36px;
}

.figure dd {
  margin-top: 2px;
  font-size: 20px;
}

.mono {
  font-family: var(--font-mono);
}

.chapter {
  display: inline-block;
  min-width: 6.4em;
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
  font-size: 12px;
}

.due {
  color: var(--color-due);
}

@media (max-width: 560px) {
  .actions {
    flex-direction: column;
  }

  .actions > * {
    width: 100%;
  }

  .chapter {
    min-width: 2.6em;
  }
}
</style>
