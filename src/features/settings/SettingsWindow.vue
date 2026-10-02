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

/** The panes, as tabs in the title bar. */
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
    <!-- The title bar holds the tabs that switch panes; the chosen tab names the pane. -->
    <header class="toolbar" data-tauri-drag-region>
      <h1 class="visually-hidden">{{ text.ui(title) }}</h1>
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
          <BaseIcon class="icon" :name="pane.icon" :size="14" />
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
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  height: var(--titlebar-height);
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-window);
}

.tabs {
  display: flex;
  gap: 2px;
}

/* A tab: its icon before its label; the chosen one is raised onto the box color. */
.tab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 24px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: var(--radius-control);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 500;

  &:hover {
    background-color: var(--color-fill);
    color: var(--color-text);
  }

  &.selected {
    border-color: var(--color-border);
    background-color: var(--color-box);
    color: var(--color-text);
  }
}

.icon {
  .selected & {
    color: var(--color-action);
  }
}

.pane {
  flex: 1 1 auto;
  padding: 16px;
  overflow: hidden auto;
}

.failed {
  margin-top: 10px;
  color: var(--color-mistake);
}
</style>
