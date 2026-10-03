<script setup lang="ts">
import { computed } from 'vue';

import { renderRich } from '@/domain/content/rich';
import type { RichText } from '@/domain/content/types';
import { renderTex } from '@/platform/math';

const { source } = defineProps<{
  /** The text to show, with its formulas. */
  source: RichText;
}>();

// Safe to bind as HTML: `renderRich` escapes everything that isn't a formula it rendered itself.
const html = computed(() => renderRich(source, renderTex));
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- escaped by renderRich -->
  <div class="rich" v-html="html" />
</template>

<style scoped>
.rich {
  overflow-wrap: break-word;

  :deep(p + p),
  :deep(p + ul),
  :deep(ul + p) {
    margin-top: 0.7em;
  }

  :deep(ul) {
    padding-left: 1.2em;
  }

  :deep(li + li) {
    margin-top: 0.35em;
  }

  :deep(strong) {
    font-weight: 600;
  }

  /* A displayed formula scrolls on its own, so a wide one never widens the page. */
  :deep(mjx-container[display='true']) {
    display: block;
    margin: 0.7em 0;
    padding: 2px 0;
    overflow-x: auto;
    overflow-y: hidden;
    text-align: center;
  }

  :deep(mjx-container svg) {
    max-width: none;
  }
}
</style>
