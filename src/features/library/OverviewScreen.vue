<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';

import GroupedList from '@/components/GroupedList.vue';
import ListSection from '@/components/ListSection.vue';
import NavigationRow from '@/components/NavigationRow.vue';
import PageLayout from '@/components/PageLayout.vue';
import TextProgress from '@/components/TextProgress.vue';
import { useSpatialNav } from '@/composables/useSpatialNav';
import { summarizeOverview } from '@/domain/progress/overview';
import type { SummaryContext } from '@/domain/progress/summary';
import { summarizeApp } from '@/domain/progress/summary';
import type { AppDefinition } from '@/domain/shortcuts/types';
import type { UiKey } from '@/i18n';
import { useText } from '@/i18n';
import { localTimeAt } from '@/localTime';
import { toApp, toReview } from '@/routes';
import { useProgressStore } from '@/stores/progress';

import ActivityChart from './ActivityChart.vue';
import { logoOf } from './logos';

const props = defineProps<{
  /** Every app Mouseless teaches. */
  apps: readonly AppDefinition[];
  /** What progress is summarized with. */
  context: SummaryContext;
}>();

const text = useText();
const progress = useProgressStore();
const nav = useTemplateRef<HTMLElement>('nav');

useSpatialNav(() => nav.value);

/** What the figures from the review log show while it isn't loaded. */
const unknown = '–';

/**
 * The overview as of the last moment of today. The context moves today on when the window gains
 * focus, so the overview follows it to a new day.
 */
const overview = computed(() => {
  const log = progress.log.status === 'loaded' ? progress.log.value.entries : [];

  return summarizeOverview(
    props.apps.map((app) => summarizeApp(app, props.context)),
    log,
    localTimeAt(props.context.endOfToday - 1),
  );
});

const logLoaded = computed(() => progress.log.status === 'loaded');

/** A figure from the review log, or {@link unknown} while the log isn't loaded. */
function fromLog(value: string): string {
  return logLoaded.value ? value : unknown;
}

/** The four figures on top, each a value and what it counts. */
const figures = computed((): readonly { readonly value: string; readonly label: UiKey }[] => {
  const { due, reviewedToday, recallRate, daysInARow } = overview.value;

  return [
    { value: String(due), label: 'overview.dueToday' },
    { value: fromLog(String(reviewedToday)), label: 'overview.reviewedToday' },
    {
      value: fromLog(recallRate === undefined ? unknown : text.percent(recallRate)),
      label: 'overview.recallRate',
    },
    { value: fromLog(String(daysInARow)), label: 'overview.daysInARow' },
  ];
});
</script>

<template>
  <PageLayout :title="text.ui('overview.title')">
    <nav ref="nav" class="overview">
      <dl class="figures">
        <div v-for="figure in figures" :key="figure.label" class="figure">
          <dt class="label">{{ text.ui(figure.label) }}</dt>
          <dd class="value">{{ figure.value }}</dd>
        </div>
      </dl>

      <ListSection :title="text.ui('overview.activity')">
        <ActivityChart v-if="logLoaded" :activity="overview.activity" />
        <p v-else-if="progress.log.status === 'failed'" class="hint">
          {{ text.ui('overview.logFailed') }}
        </p>
      </ListSection>

      <ListSection v-if="overview.dueApps.length > 0" :title="text.ui('library.dueToday')">
        <GroupedList>
          <NavigationRow
            v-for="summary in overview.dueApps"
            :key="summary.app.id"
            :to="toReview(summary.app.id)"
          >
            <template #leading><img class="logo" :src="logoOf(summary.app.id)" alt="" /></template>
            {{ text.appTitle(summary.app) }}
            <template #meta>{{ text.ui('library.due', { n: summary.due }) }}</template>
          </NavigationRow>
        </GroupedList>
      </ListSection>

      <ListSection v-if="overview.learnedApps.length > 0" :title="text.ui('overview.progress')">
        <p class="total">
          {{
            text.ui('overview.learnedOf', {
              learned: overview.learned,
              shortcuts: overview.shortcuts,
            })
          }}
        </p>
        <GroupedList>
          <NavigationRow
            v-for="summary in overview.learnedApps"
            :key="summary.app.id"
            :to="toApp(summary.app.id)"
          >
            <template #leading><img class="logo" :src="logoOf(summary.app.id)" alt="" /></template>
            {{ text.appTitle(summary.app) }}
            <template #meta>
              <!-- A meter: the learned share in the accent on a lighter track of it. -->
              <span class="meter" aria-hidden="true">
                <span
                  class="fill"
                  :style="{ width: `${(summary.learned / summary.shortcuts) * 100}%` }"
                />
              </span>
              <TextProgress :value="summary.learned" :max="summary.shortcuts" />
            </template>
          </NavigationRow>
        </GroupedList>
      </ListSection>
      <p v-else class="hint">{{ text.ui('library.choose') }}</p>
    </nav>
  </PageLayout>
</template>

<style scoped>
.overview {
  display: grid;
  gap: 24px;
  padding-top: 8px;
}

/* Four figures in a row, each in a grouped box, the value large and its label below. */
.figures {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.figure {
  display: flex;
  flex-direction: column-reverse;
  gap: 2px;
  padding: 10px 12px;
  border-radius: var(--radius-box);
  background-color: var(--color-box);
}

.value {
  font-size: 24px;
  font-weight: 600;
}

.label {
  color: var(--color-label-secondary);
  font-size: 11px;
}

.total {
  margin: -2px 0 6px 2px;
  color: var(--color-label-secondary);
}

.logo {
  width: 20px;
  height: 20px;
  flex: none;
  object-fit: contain;
}

.meter {
  width: 120px;
  height: 6px;
  overflow: hidden;
  border-radius: 3px;
  background-color: color-mix(in srgb, var(--color-accent) 20%, transparent);
}

.fill {
  display: block;
  height: 100%;
  border-radius: 3px;
  background-color: var(--color-accent);
}

.hint {
  color: var(--color-label-secondary);
  text-align: center;
}
</style>
