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
/* A flat search field with a hairline; focus shows the shared ring. */
.search {
  flex: none;
  width: 100%;
  height: 24px;
  padding: 0 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background-color: var(--color-content);
  color: var(--color-text);
  font: inherit;
  font-size: 12px;

  &::placeholder {
    color: var(--color-text-tertiary);
  }
}

.list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  margin: 4px -10px 0;
  padding: 0 10px 10px;
}

.hint {
  padding: 24px 0;
  color: var(--color-text-secondary);
  text-align: center;
}

.group + .group {
  margin-top: 4px;
}

/* A section label: small uppercase mono, faint. */
.group-title {
  padding: 6px 2px 2px;
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

ul {
  list-style: none;
}

/* A dense row: the title on the left, its keys on the right. */
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 20px;
  padding: 0 2px;
  font-size: 12px;
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
