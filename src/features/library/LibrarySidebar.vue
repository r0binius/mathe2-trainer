<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import { useRoute } from 'vue-router';

import BaseIcon from '@/components/BaseIcon.vue';
import type { SummaryContext } from '@/domain/progress/summary';
import { groupByCategory, recentFirst, summarizeApp } from '@/domain/progress/summary';
import type { AppDefinition } from '@/domain/shortcuts/types';
import { useText } from '@/i18n';
import { toApp, toOverview } from '@/routes';

import { logoOf } from './logos';

const props = defineProps<{
  /** Every app Mouseless teaches. */
  apps: readonly AppDefinition[];
  /** What progress is summarized with. */
  context: SummaryContext;
}>();

const emit = defineEmits<{
  /** → was pressed on a row: focus moves on into its detail. */
  enter: [];
}>();

const route = useRoute();
const text = useText();
const list = useTemplateRef<HTMLElement>('list');

const summaries = computed(() => props.apps.map((app) => summarizeApp(app, props.context)));
const recent = computed(() => recentFirst(summaries.value));

/** Each app once: the recent ones under Recent, the others under their category. */
const sections = computed(() => [
  ...(recent.value.length > 0
    ? [{ id: 'recent', title: text.ui('library.recent'), apps: recent.value }]
    : []),
  ...groupByCategory(summaries.value.filter((summary) => !recent.value.includes(summary))).map(
    ({ category, apps }) => ({ id: category, title: text.ui(`categories.${category}`), apps }),
  ),
]);

/** How far ↑ and ↓ move the selection. */
const steps: Readonly<Record<string, number>> = { ArrowUp: -1, ArrowDown: 1 };

/** The app the detail shows, which the sidebar highlights. */
const selectedId = computed(() => route.params['appId']);
const overviewShown = computed(() => route.name === 'overview');

function items(): readonly HTMLAnchorElement[] {
  return [...(list.value?.querySelectorAll('a') ?? [])];
}

/** Focuses the selected row, or the first one: where focus goes back to from the detail. */
function focusSelected(): void {
  const all = items();

  (all.find((item) => item.getAttribute('aria-current') === 'page') ?? all[0])?.focus();
}

/** ↑ and ↓ select the row above or below, as in a native sidebar; → moves into the detail. */
function onKeyDown(event: KeyboardEvent): void {
  const all = items();
  const index = all.findIndex((item) => item === document.activeElement);
  const step = steps[event.key];

  if (step !== undefined) {
    event.preventDefault();
    const next = all[Math.min(Math.max(index + step, 0), all.length - 1)];
    next?.focus();
    next?.click();
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    emit('enter');
  }
}

defineExpose({ focusSelected });
</script>

<template>
  <nav class="sidebar" :aria-label="text.ui('library.apps')">
    <!-- The window's buttons sit here; dragging the space moves the window. -->
    <div class="titlebar" data-tauri-drag-region />

    <div ref="list" class="list" @keydown="onKeyDown">
      <section class="section">
        <RouterLink class="item" :class="{ selected: overviewShown }" :to="toOverview()">
          <BaseIcon class="icon" name="chart" :size="16" />
          <span class="title truncate">{{ text.ui('overview.title') }}</span>
        </RouterLink>
      </section>
      <section v-for="section in sections" :key="section.id" class="section">
        <h2 class="heading">{{ section.title }}</h2>
        <RouterLink
          v-for="summary in section.apps"
          :key="summary.app.id"
          class="item"
          :class="{ selected: selectedId === summary.app.id }"
          :to="toApp(summary.app.id)"
        >
          <img class="logo" :src="logoOf(summary.app.id)" alt="" />
          <span class="title truncate">{{ text.appTitle(summary.app) }}</span>
          <span v-if="summary.due > 0" class="due">{{ summary.due }}</span>
        </RouterLink>
      </section>
    </div>
  </nav>
</template>

<style scoped>
/* Transparent from edge to edge, so the window's sidebar material shows through, as on macOS 27. */
.sidebar {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.titlebar {
  flex: none;
  height: var(--toolbar-height);
}

.list {
  flex: 1 1 auto;
  padding: 0 10px 10px;
  font-size: 13px;
  overflow: hidden auto;
}

.section + .section {
  margin-top: 16px;
}

/* A sidebar section header: small, semibold and faint. */
.heading {
  padding: 0 6px 4px;
  color: var(--color-label-tertiary);
  font-size: 11px;
  font-weight: 600;
}

.item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 8px;
  border-radius: var(--radius-row);

  /* The selection is bold, lightened accent while the sidebar has focus, and gray otherwise. */
  &.selected {
    background-color: var(--color-fill-hover);
    font-weight: 600;
  }

  .list:focus-within &.selected {
    background-color: var(--color-selection);
    color: var(--color-on-accent);
  }

  &:focus-visible {
    outline: none;
  }
}

.logo {
  width: 20px;
  height: 20px;
  flex: none;
  object-fit: contain;
}

/* A symbol in the space of an app's logo, in the accent as in Finder's sidebar. */
.icon {
  width: 20px;
  flex: none;
  color: var(--color-accent);

  .list:focus-within .selected & {
    color: inherit;
  }
}

.title {
  flex: 1 1 auto;
}

/* A count like Mail's unread one. */
.due {
  color: var(--color-label-secondary);
  font-variant-numeric: tabular-nums;

  .list:focus-within .selected & {
    color: inherit;
  }
}
</style>
