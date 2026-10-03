<script setup lang="ts">
import { computed } from 'vue';

import type { Item } from '@/domain/content/types';
import { kindLabels } from '@/labels';

import RichText from './RichText.vue';

const { item } = defineProps<{
  /** The item to show in full: with its statement, reason or solution. */
  item: Item;
}>();

/** What kind of item it is and where it comes from, as one line. */
const meta = computed(() => {
  const reference =
    item.kind === 'problem' || item.ref === undefined ? undefined : `Skript: ${item.ref}`;
  const origin = item.kind === 'problem' ? item.source : reference;
  const worth = item.kind === 'problem' ? ` (${String(item.points)} Punkte)` : '';

  return [kindLabels[item.kind] + worth, origin].filter((part) => part !== undefined).join(', ');
});
</script>

<template>
  <article class="card">
    <template v-if="item.kind === 'definition' || item.kind === 'theorem'">
      <RichText :source="item.statement" />
      <aside v-if="item.note !== undefined" class="note">
        <RichText :source="item.note" />
      </aside>
    </template>
    <template v-else-if="item.kind === 'claim'">
      <RichText :source="item.statement" />
      <p class="verdict" :class="item.holds ? 'holds' : 'fails'">
        {{ item.holds ? 'Wahr' : 'Falsch' }}
      </p>
      <RichText :source="item.reason" />
    </template>
    <template v-else-if="item.kind === 'problem'">
      <RichText :source="item.task" />
      <h3 class="caption label">Lösung</h3>
      <RichText :source="item.solution" />
    </template>
    <p class="meta">{{ meta }}</p>
  </article>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* A note stands apart from the statement by a rule in the due color: worth a second look. */
.note {
  padding-left: 10px;
  border-left: 2px solid var(--color-due);
  color: var(--color-text-secondary);
  font-size: 0.93em;
}

.verdict {
  font-weight: 600;

  &.holds {
    color: var(--color-learned);
  }

  &.fails {
    color: var(--color-mistake);
  }
}

.label {
  margin-top: 4px;
}

.meta {
  color: var(--color-text-tertiary);
  font-size: 12px;
}
</style>
