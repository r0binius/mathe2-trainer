<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import BaseButton from '@/components/BaseButton.vue';
import KeyCapSmall from '@/components/KeyCapSmall.vue';
import PageLayout from '@/components/PageLayout.vue';
import ResultBadge from '@/components/ResultBadge.vue';
import TextProgress from '@/components/TextProgress.vue';
import { labelKey, macosKeyLabels } from '@/domain/keyboard/labels';
import type { SummaryContext } from '@/domain/progress/summary';
import { summarizeSet } from '@/domain/progress/summary';
import type { AppDefinition, ShortcutSet } from '@/domain/shortcuts/types';
import { useText } from '@/i18n';
import { toApp } from '@/router';

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

const summary = computed(() => summarizeSet(props.app.id, props.set, props.context));
const title = computed(() => text.app(props.app.id, props.set.title));
</script>

<template>
  <PageLayout :title="app.title" :subtitle="title">
    <template #start>
      <BaseButton icon="arrowLeft" @click="router.push(toApp(app.id))">
        {{ text.ui('set.back') }}
      </BaseButton>
    </template>

    <header class="header">
      <h1 class="title truncate">{{ title }}</h1>
      <p class="meta">
        <template v-if="summary.learned.length > 0">
          <TextProgress :value="summary.learned.length" :max="summary.items.length" />
          {{ text.ui('set.learned') }}
        </template>
        <template v-else>{{ text.count('library.shortcuts', summary.items.length) }}</template>
      </p>
    </header>

    <ul class="rows">
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
          <KeyCapSmall v-for="key in item.keys" :key="key" :label="labelKey(macosKeyLabels, key)" />
        </div>
      </li>
    </ul>
  </PageLayout>
</template>

<style scoped>
.header {
  padding: 40px 0 24px;
}

.title {
  font-size: 34px;
  font-weight: 700;
}

.meta {
  margin-top: 4px;
  color: color-mix(in srgb, var(--color-white) 50%, transparent);
  font-size: 14px;
  font-weight: 600;
}

.rows {
  display: grid;
  gap: 2px;
  border-radius: 9px;
  overflow: hidden;
  list-style: none;
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background-color: color-mix(in srgb, var(--color-white) 8%, transparent);
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

.shortcut {
  font-size: 14px;
  font-weight: 600;
}

.description {
  margin-top: 2px;
  color: color-mix(in srgb, var(--color-white) 50%, transparent);
  font-size: 12px;
}

.keys {
  display: flex;
  flex: none;
  gap: 4px;
}
</style>
