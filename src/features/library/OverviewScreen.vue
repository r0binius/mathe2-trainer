<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';

import GroupedList from '@/components/GroupedList.vue';
import ListSection from '@/components/ListSection.vue';
import NavigationRow from '@/components/NavigationRow.vue';
import PageLayout from '@/components/PageLayout.vue';
import ScreenHeading from '@/components/ScreenHeading.vue';
import TextProgress from '@/components/TextProgress.vue';
import { useSpatialNav } from '@/composables/useSpatialNav';
import { summarizeOverview } from '@/domain/progress/overview';
import type { SummaryContext } from '@/domain/progress/summary';
import { summarizeApp } from '@/domain/progress/summary';
import type { AppDefinition } from '@/domain/shortcuts/types';
import { byKeyboard } from '@/domain/usage/byKeyboard';
import { yourCommandsId } from '@/domain/usage/yourCommands';
import type { UiKey } from '@/i18n';
import { useText } from '@/i18n';
import { localTimeAt } from '@/localTime';
import { toApp, toReview, toSet } from '@/routes';
import { useProgressStore } from '@/stores/progress';
import { useSettingsStore } from '@/stores/settings';
import { useUsageStore } from '@/stores/usage';

import ActivityChart from './ActivityChart.vue';
import AppLogo from './AppLogo.vue';

const props = defineProps<{
  /** Every app Mouseless teaches. */
  apps: readonly AppDefinition[];
  /** What progress is summarized with. */
  context: SummaryContext;
}>();

const text = useText();
const progress = useProgressStore();
const settings = useSettingsStore();
const usage = useUsageStore();
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

/**
 * How the user worked lately, while learning from work is on and anything was counted: the share
 * done with the keys, and the commands still chosen from menus most.
 */
const keyboard = computed(() => {
  const learning = settings.current?.learnFromWork === true;
  const summary =
    learning && usage.usage.status === 'loaded'
      ? byKeyboard(props.apps, usage.usage.value.counts)
      : undefined;

  return summary?.share === undefined ? undefined : { ...summary, share: summary.share };
});

/** A figure from the review log, or {@link unknown} while the log isn't loaded. */
function fromLog(value: string): string {
  return logLoaded.value ? value : unknown;
}

/** What a figure's value means, which its color shows: due counts and recall in their accents. */
type FigureTone = 'due' | 'learned' | 'plain';

/** The four figures on top, each a value, what it counts and its tone. */
const figures = computed(
  (): readonly { readonly value: string; readonly label: UiKey; readonly tone: FigureTone }[] => {
    const { due, reviewedToday, recallRate, daysInARow } = overview.value;

    return [
      { value: String(due), label: 'overview.dueToday', tone: due > 0 ? 'due' : 'plain' },
      { value: fromLog(String(reviewedToday)), label: 'overview.reviewedToday', tone: 'plain' },
      {
        value: fromLog(recallRate === undefined ? unknown : text.percent(recallRate)),
        label: 'overview.recallRate',
        tone: recallRate === undefined ? 'plain' : 'learned',
      },
      { value: fromLog(String(daysInARow)), label: 'overview.daysInARow', tone: 'plain' },
    ];
  },
);
</script>

<template>
  <PageLayout>
    <nav ref="nav" class="overview">
      <ScreenHeading class="heading" :title="text.ui('overview.title')" />
      <dl class="figures">
        <div v-for="figure in figures" :key="figure.label" class="figure">
          <dt class="caption">{{ text.ui(figure.label) }}</dt>
          <dd class="value" :class="figure.tone">{{ figure.value }}</dd>
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
            <template #leading><AppLogo :app-id="summary.app.id" /></template>
            {{ text.appTitle(summary.app) }}
            <template #meta>{{ text.ui('library.due', { n: summary.due }) }}</template>
          </NavigationRow>
        </GroupedList>
      </ListSection>

      <ListSection v-if="keyboard !== undefined" :title="text.ui('overview.byKeyboard')">
        <p class="total">
          {{ text.ui('overview.keyboardShare', { share: text.percent(keyboard.share) }) }}
        </p>
        <GroupedList v-if="keyboard.fromMenus.length > 0">
          <NavigationRow
            v-for="leader in keyboard.fromMenus"
            :key="`${leader.app.id}/${leader.shortcut.title}`"
            :to="toSet(leader.app.id, yourCommandsId)"
          >
            <template #leading><AppLogo :app-id="leader.app.id" /></template>
            {{ text.app(leader.app.id, leader.shortcut.title) }}
            <template #meta>{{ text.count('overview.fromMenu', leader.byMenu) }}</template>
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
            <template #leading><AppLogo :app-id="summary.app.id" /></template>
            {{ text.appTitle(summary.app) }}
            <template #meta>
              <!-- A meter: the learned share in the learned color on a track in the border color. -->
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
  gap: 10px;
}

/* The grid's gap spaces the heading, so it needs no padding of its own. */
.heading {
  padding-bottom: 0;
}

/* Four figures in a row, each in a box, the value in mono and its label below. */
.figures {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.figure {
  display: flex;
  flex-direction: column-reverse;
  gap: 2px;
  padding: 6px 9px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-box);
  background-color: var(--color-box);
}

.value {
  font-family: var(--font-mono);
  font-size: 19px;
  font-weight: 500;

  &.due {
    color: var(--color-due);
  }

  &.learned {
    color: var(--color-learned);
  }
}

.total {
  margin: -2px 0 6px 1px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.meter {
  width: 90px;
  height: 4px;
  overflow: hidden;
  border-radius: 2px;
  background-color: var(--color-border);
}

.fill {
  display: block;
  height: 100%;
  border-radius: 2px;
  background-color: var(--color-learned);
}

.hint {
  color: var(--color-text-secondary);
  text-align: center;
}
</style>
