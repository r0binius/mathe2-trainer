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
    <!-- The window's buttons sit here, then the app's name; dragging the space moves the window. -->
    <div class="titlebar" data-tauri-drag-region>
      <span class="name" aria-hidden="true" data-tauri-drag-region>mouseless</span>
    </div>

    <div ref="list" class="list" @keydown="onKeyDown">
      <section class="section">
        <RouterLink class="item" :class="{ selected: overviewShown }" :to="toOverview()">
          <BaseIcon class="icon" name="chart" :size="14" />
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
/* The window's color from edge to edge, with hairlines to the detail and below the title bar. */
.sidebar {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid var(--color-border);
  background-color: var(--color-window);
}

.titlebar {
  display: flex;
  flex: none;
  align-items: center;
  height: var(--titlebar-height);
  padding-left: 78px;
  border-bottom: 1px solid var(--color-border);
}

/* The app's name after the window's buttons, small in mono, as a quiet mark. */
.name {
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
}

.list {
  flex: 1 1 auto;
  padding: 6px;
  overflow: hidden auto;
}

/* A section label: small uppercase mono, faint. */
.heading {
  padding: 10px 8px 4px;
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 24px;
  padding: 0 8px;
  border-radius: var(--radius-box);
  color: var(--color-text-secondary);

  &:hover {
    background-color: var(--color-fill);
  }

  /* The selection: a raised row with a bar in the action color on its leading edge. */
  &.selected {
    background-color: var(--color-box);
    box-shadow: inset 2px 0 0 var(--color-action);
    color: var(--color-text);
  }

  &:focus-visible {
    outline: none;
  }
}

.logo {
  width: 14px;
  height: 14px;
  flex: none;
  object-fit: contain;
}

/* A symbol in the space of an app's logo, in the action color. */
.icon {
  width: 14px;
  flex: none;
  color: var(--color-action);
}

.title {
  flex: 1 1 auto;
}

/* How many of the app's shortcuts are due, in the due color. */
.due {
  color: var(--color-due);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
}
</style>
