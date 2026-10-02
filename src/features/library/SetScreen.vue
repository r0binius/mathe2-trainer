<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

import BaseButton from '@/components/BaseButton.vue';
import GroupedList from '@/components/GroupedList.vue';
import KeyCapSmall from '@/components/KeyCapSmall.vue';
import PageLayout from '@/components/PageLayout.vue';
import ResultBadge from '@/components/ResultBadge.vue';
import ScreenHeading from '@/components/ScreenHeading.vue';
import TextProgress from '@/components/TextProgress.vue';
import { useKeyLabels } from '@/composables/useKeyLabels';
import { useSpatialNav } from '@/composables/useSpatialNav';
import type { SummaryContext } from '@/domain/progress/summary';
import { summarizeSet } from '@/domain/progress/summary';
import type { AppDefinition, ShortcutSet } from '@/domain/shortcuts/types';
import { useText } from '@/i18n';
import { toApp, toLearn } from '@/routes';

const props = defineProps<{
  /** The app the set belongs to. */
  app: AppDefinition;
  /** The set whose shortcuts are shown. */
  set: ShortcutSet;
  /** What progress is summarized with. */
  context: SummaryContext;
}>();

const router = useRouter();
const text = useText();
const labelOf = useKeyLabels();
const nav = useTemplateRef<HTMLElement>('nav');

useSpatialNav(
  () => nav.value,
  () => {
    void router.push(toApp(props.app.id));
  },
);

const summary = computed(() => summarizeSet(props.app.id, props.set, props.context));
const title = computed(() => text.app(props.app.id, props.set.title));

/** Continues a set started before; a completed set is learned again from the start. */
const continues = computed(() => {
  const { learned, items } = summary.value;

  return learned.length > 0 && learned.length < items.length;
});
</script>

<template>
  <PageLayout :title="text.appTitle(app)" :subtitle="title">
    <template #start>
      <BaseButton
        variant="toolbar"
        icon="chevronLeft"
        :label="text.ui('set.back')"
        @click="router.push(toApp(app.id))"
      />
    </template>

    <nav ref="nav">
      <ScreenHeading :title="title">
        <template #meta>
          <template v-if="summary.learned.length > 0">
            <TextProgress :value="summary.learned.length" :max="summary.items.length" />
            {{ text.ui('set.learned') }}
          </template>
          <template v-else>{{ text.count('library.shortcuts', summary.items.length) }}</template>
        </template>
        <template v-if="summary.items.length > 0" #action>
          <BaseButton variant="accent" size="large" @click="router.push(toLearn(app.id, set.id))">
            {{ text.ui(continues ? 'set.continue' : 'set.start') }}
          </BaseButton>
        </template>
      </ScreenHeading>

      <GroupedList tag="ul">
        <li
          v-for="item in summary.items"
          :key="item.id"
          class="row"
          :class="{ learned: summary.learned.includes(item.id) }"
        >
          <!-- Always there, so the titles line up whether a shortcut is learned or not. -->
          <ResultBadge class="check" result="correct" />
          <div class="text">
            <div class="shortcut">{{ text.app(app.id, item.title) }}</div>
            <div v-if="item.description !== undefined" class="description">
              {{ text.app(app.id, item.description) }}
            </div>
          </div>
          <div class="keys">
            <KeyCapSmall v-for="key in item.keys" :key="key" :label="labelOf(key)" />
          </div>
        </li>
      </GroupedList>
    </nav>
  </PageLayout>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 7px 12px;
}

.check {
  visibility: hidden;

  .learned & {
    visibility: visible;
  }
}

.text {
  flex: 1 1 auto;
  min-width: 0;
}

.description {
  margin-top: 1px;
  color: var(--color-text-secondary);
  font-size: 11px;
}

.keys {
  display: flex;
  flex: none;
}
</style>
