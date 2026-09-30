<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import BaseIcon from '@/components/BaseIcon.vue';
import type { IconName } from '@/components/icons';
import { uiLanguageFor } from '@/domain/settings/language';
import type { Settings } from '@/domain/settings/settings';
import type { UiKey } from '@/i18n';
import { useText, useUiLanguage } from '@/i18n';
import { useKeymapStore } from '@/stores/keymap';
import { useSettingsStore } from '@/stores/settings';

import GeneralPane from './GeneralPane.vue';
import ProgressPane from './ProgressPane.vue';
import TriggerPane from './TriggerPane.vue';

type Pane = 'general' | 'trigger' | 'progress';

/** The panes in the toolbar, as in the Settings windows of Apple's apps. */
const panes: readonly { readonly id: Pane; readonly icon: IconName; readonly title: UiKey }[] = [
  { id: 'general', icon: 'gear', title: 'settings.panes.general' },
  { id: 'trigger', icon: 'keyboard', title: 'settings.panes.trigger' },
  { id: 'progress', icon: 'chart', title: 'settings.panes.progress' },
];

const settings = useSettingsStore();
const keymap = useKeymapStore();
const text = useText();
const shown = ref<Pane>('general');
const failed = ref(false);

const title = computed(
  () => panes.find((pane) => pane.id === shown.value)?.title ?? 'settings.title',
);

useUiLanguage(() =>
  settings.settings.status === 'loaded'
    ? uiLanguageFor(settings.settings.value.language, navigator.languages)
    : undefined,
);

// The recorder turns key presses into combinations on the current layout.
onMounted(() => {
  void settings.load();
  void keymap.load();
});

/** Saves the settings with `changes`, and shows when that failed. */
async function change(changes: Partial<Settings>): Promise<void> {
  if (settings.settings.status === 'loaded') {
    const saved = await settings.save({ ...settings.settings.value, ...changes });
    failed.value = saved.kind === 'err';
  }
}
</script>

<template>
  <div class="window">
    <!-- The title bar with the pane's name, and the toolbar that switches panes below it. -->
    <header class="toolbar" data-tauri-drag-region>
      <h1 class="title" data-tauri-drag-region>{{ text.ui(title) }}</h1>
      <div class="tabs" role="tablist" data-tauri-drag-region>
        <button
          v-for="pane in panes"
          :key="pane.id"
          class="tab"
          :class="{ selected: shown === pane.id }"
          type="button"
          role="tab"
          :aria-selected="shown === pane.id"
          @click="shown = pane.id"
        >
          <BaseIcon :name="pane.icon" :size="22" />
          <span>{{ text.ui(pane.title) }}</span>
        </button>
      </div>
    </header>

    <main v-if="settings.settings.status === 'loaded'" class="pane" role="tabpanel">
      <GeneralPane
        v-if="shown === 'general'"
        :settings="settings.settings.value"
        @change="change"
      />
      <TriggerPane
        v-else-if="shown === 'trigger'"
        :trigger="settings.settings.value.trigger"
        @choose="(trigger) => change({ trigger })"
      />
      <ProgressPane v-else @reset="(resetFailed) => (failed = resetFailed)" />
      <p v-if="failed" class="failed">{{ text.ui('settings.saveFailed') }}</p>
    </main>
    <p v-else-if="settings.settings.status === 'failed'" class="failed pane">
      {{ text.ui('startup.failed') }}
    </p>
  </div>
</template>

<style scoped>
.window {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.toolbar {
  display: grid;
  flex: none;
  justify-items: center;
  padding: 7px 0 6px;
  border-bottom: 1px solid var(--color-separator);
}

.title {
  font-size: 13px;
  font-weight: 700;
}

.tabs {
  display: flex;
  gap: 2px;
  margin-top: 8px;
}

/* A toolbar item with its icon over its label; the chosen pane's is tinted with the accent. */
.tab {
  display: grid;
  justify-items: center;
  gap: 2px;
  min-width: 64px;
  padding: 4px 8px;
  border-radius: 10px;
  color: var(--color-label-secondary);
  font-size: 11px;

  &:hover {
    color: var(--color-label);
  }

  &.selected {
    background-color: var(--color-fill);
    color: var(--color-accent);
  }
}

.pane {
  flex: 1 1 auto;
  padding: 20px;
  overflow: hidden auto;
}

.failed {
  margin-top: 12px;
  color: var(--color-red);
}
</style>
