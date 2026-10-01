<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';

import KeyCapSmall from '@/components/KeyCapSmall.vue';
import { useKeyLabels } from '@/composables/useKeyLabels';
import type { LookupGroup } from '@/domain/lookup/rows';
import { searchGroups } from '@/domain/lookup/search';
import { useText } from '@/i18n';

const props = defineProps<{
  /** The shortcuts, by menu or set. */
  groups: readonly LookupGroup[];
  /** What it says when the app has no shortcuts at all. */
  empty: string;
}>();

/** What's typed in the search field, which filters the shortcuts by title and group. */
const query = defineModel<string>('query', { required: true });

const text = useText();
const labelOf = useKeyLabels();
const search = useTemplateRef<HTMLInputElement>('search');

const shown = computed(() => searchGroups(props.groups, query.value, (row) => row.title));

defineExpose({
  /** Puts the cursor in the search field, so typing searches right away. */
  focus: () => {
    search.value?.focus();
  },
});
</script>

<template>
  <input
    ref="search"
    v-model="query"
    class="search"
    type="search"
    :placeholder="text.ui('popover.search')"
    :aria-label="text.ui('popover.search')"
  />
  <div class="list">
    <p v-if="groups.length === 0" class="hint">{{ empty }}</p>
    <p v-else-if="shown.length === 0" class="hint">{{ text.ui('popover.noMatches') }}</p>
    <section v-for="group in shown" :key="group.title" class="group">
      <h2 class="group-title">{{ group.title }}</h2>
      <ul>
        <li v-for="(row, index) in group.items" :key="index" class="row">
          <span class="title truncate">{{ row.title }}</span>
          <span class="keys">
            <KeyCapSmall v-for="key in row.keys" :key="key" :label="labelOf(key)" />
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
/* A rounded search field, as in the toolbars of macOS 27. */
.search {
  flex: none;
  width: 100%;
  height: 28px;
  padding: 0 12px;
  border: none;
  border-radius: var(--radius-control);
  background-color: var(--color-fill);
  color: var(--color-label);
  font: inherit;
  font-size: 13px;
  outline: none;

  &:focus-visible {
    box-shadow: 0 0 0 3px var(--color-selection);
  }
}

.list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  margin: 8px -12px 0;
  padding: 0 12px 12px;
}

.hint {
  padding: 24px 0;
  color: var(--color-label-secondary);
  text-align: center;
}

.group + .group {
  margin-top: 8px;
}

/* A section heading, as in a menu. */
.group-title {
  padding: 4px 0;
  color: var(--color-label-secondary);
  font-size: 11px;
  font-weight: 600;
}

ul {
  list-style: none;
}

/* A row as a menu item: the title on the left, its keys on the right. */
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 22px;
  font-size: 13px;
}

.title {
  flex: 1 1 auto;
}

.keys {
  display: inline-flex;
  flex: none;
  gap: 1px;
}
</style>
