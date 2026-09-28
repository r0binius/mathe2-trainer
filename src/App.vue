<script setup lang="ts">
import { onMounted, watch } from 'vue';

import { useSummaryContext } from './composables/useSummaryContext';
import { apps } from './data/apps';
import { useText } from './i18n';
import { useKeymapStore } from './stores/keymap';
import { useProgressStore } from './stores/progress';
import { useSettingsStore } from './stores/settings';

const settings = useSettingsStore();
const keymap = useKeymapStore();
const progress = useProgressStore();
const context = useSummaryContext();
const text = useText();

onMounted(() => {
  void settings.load();
  void keymap.load();
  void progress.load(apps);
});

watch(context, (loaded) => {
  if (loaded.status === 'failed') {
    console.error(`Could not load: ${loaded.error.message}`);
  }
});
</script>

<template>
  <!-- Every screen summarizes progress, so each gets the loaded context. -->
  <RouterView v-if="context.status === 'loaded'" v-slot="{ Component }">
    <component :is="Component" :context="context.value" />
  </RouterView>
  <p v-else-if="context.status === 'failed'" class="failed">{{ text.ui('startup.failed') }}</p>
</template>

<style scoped>
.failed {
  display: grid;
  place-items: center;
  height: 100vh;
  padding: 32px;
  color: color-mix(in srgb, var(--color-white) 50%, transparent);
  text-align: center;
}
</style>
