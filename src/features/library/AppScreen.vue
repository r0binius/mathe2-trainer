<script setup lang="ts">
import { computed, inject, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

import BaseButton from '@/components/BaseButton.vue';
import GroupedList from '@/components/GroupedList.vue';
import ListSection from '@/components/ListSection.vue';
import PageLayout from '@/components/PageLayout.vue';
import ScreenHeading from '@/components/ScreenHeading.vue';
import { useSpatialNav } from '@/composables/useSpatialNav';
import type { SummaryContext } from '@/domain/progress/summary';
import { recentFirst, summarizeApp, summarizeSet } from '@/domain/progress/summary';
import { daysUntil } from '@/domain/scheduling/days';
import type { AppDefinition } from '@/domain/shortcuts/types';
import { useText } from '@/i18n';
import { toReview } from '@/routes';

import { logoOf } from './logos';
import SetRow from './SetRow.vue';
import { focusSidebarKey } from './sidebarFocus';

const props = defineProps<{
  /** The app whose sets are shown. */
  app: AppDefinition;
  /** What progress is summarized with. */
  context: SummaryContext;
}>();

const router = useRouter();
const text = useText();
const nav = useTemplateRef<HTMLElement>('nav');

// ← and Escape lead back to the app in the sidebar.
useSpatialNav(
  () => nav.value,
  inject(focusSidebarKey, () => undefined),
);

const summary = computed(() => summarizeApp(props.app, props.context));
const sets = computed(() =>
  props.app.sets.map((set) => summarizeSet(props.app.id, set, props.context)),
);
const recent = computed(() => recentFirst(sets.value));
const others = computed(() => sets.value.filter((set) => set.practicedAt === undefined));

/** When the next review is, while none is due today. */
const nextReview = computed(() => {
  const { due, nextDueAt } = summary.value;

  return due === 0 && nextDueAt !== undefined
    ? text.ui('app.nextReview', {
        when: text.inDays(daysUntil(nextDueAt, props.context.endOfToday)),
      })
    : undefined;
});
</script>

<template>
  <PageLayout :title="text.appTitle(app)">
    <nav ref="nav">
      <ScreenHeading :title="text.appTitle(app)">
        <template #leading><img class="logo" :src="logoOf(app.id)" alt="" /></template>
        <template v-if="nextReview !== undefined" #meta>{{ nextReview }}</template>
        <template v-if="summary.due > 0" #action>
          <BaseButton variant="accent" size="large" @click="router.push(toReview(app.id))">
            {{ text.ui('app.review', { n: summary.due }) }}
          </BaseButton>
        </template>
      </ScreenHeading>

      <div class="sections">
        <ListSection v-if="recent.length > 0" :title="text.ui('library.recent')">
          <GroupedList>
            <SetRow v-for="set in recent" :key="set.set.id" :app-id="app.id" :summary="set" />
          </GroupedList>
        </ListSection>

        <ListSection v-if="others.length > 0" :title="text.ui('app.sets')">
          <GroupedList>
            <SetRow v-for="set in others" :key="set.set.id" :app-id="app.id" :summary="set" />
          </GroupedList>
        </ListSection>
      </div>
    </nav>
  </PageLayout>
</template>

<style scoped>
.logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.sections {
  display: grid;
  gap: 24px;
}
</style>
