<script setup lang="ts">
import { onScopeDispose, ref } from 'vue';

import BaseButton from '@/components/BaseButton.vue';
import type { LanguageSetting } from '@/domain/settings/language';
import type { Settings } from '@/domain/settings/settings';
import { useText } from '@/i18n';
import { useProgressStore } from '@/stores/progress';
import { useSettingsStore } from '@/stores/settings';

import TriggerOption from './TriggerOption.vue';

const emit = defineEmits<{
  /** The panel should close: its close button or Escape was pressed. */
  close: [];
}>();

/** How long "Click again to reset" waits for the second click. */
const confirmMs = 3000;

const settings = useSettingsStore();
const progress = useProgressStore();
const text = useText();

/** Languages are named in themselves, so each is recognizable whatever the UI shows. */
const languages: readonly (readonly [LanguageSetting, string])[] = [
  ['en', 'English'],
  ['de', 'Deutsch'],
];

const failed = ref(false);
/** Whether a trigger shortcut is being recorded, which takes Escape from the panel. */
const recording = ref(false);
const confirming = ref(false);
const confirmTimer = ref<ReturnType<typeof setTimeout>>();

/** Saves the settings with `changes`, and shows when that failed. */
async function change(changes: Partial<Settings>): Promise<void> {
  if (settings.settings.status !== 'loaded') {
    return;
  }

  const saved = await settings.save({ ...settings.settings.value, ...changes });
  failed.value = saved.kind === 'err';
}

async function chooseLanguage(event: Event): Promise<void> {
  const select = event.target;

  if (select instanceof HTMLSelectElement) {
    await change({
      language: languages.find(([value]) => value === select.value)?.[0] ?? 'system',
    });
  }
}

/** The checked state of a checkbox that changed. */
function checkedOf(event: Event): boolean {
  return event.target instanceof HTMLInputElement && event.target.checked;
}

async function reset(): Promise<void> {
  clearTimeout(confirmTimer.value);

  if (!confirming.value) {
    confirming.value = true;
    confirmTimer.value = setTimeout(() => {
      confirming.value = false;
    }, confirmMs);
    return;
  }

  confirming.value = false;
  failed.value = (await progress.reset()).kind === 'err';
}

// Keys reach the panel before practice sees them, so choosing a language by keyboard doesn't
// count as an answer behind it, and Escape closes the panel.
function onKeyDown(event: KeyboardEvent): void {
  event.stopPropagation();

  if (event.key === 'Escape' && !recording.value) {
    emit('close');
  }
}

window.addEventListener('keydown', onKeyDown, { capture: true });

onScopeDispose(() => {
  window.removeEventListener('keydown', onKeyDown, { capture: true });
  clearTimeout(confirmTimer.value);
});
</script>

<template>
  <section class="panel" :aria-label="text.ui('options.title')">
    <header class="header">
      <h2>{{ text.ui('options.title') }}</h2>
      <BaseButton icon="close" :label="text.ui('options.close')" @click="emit('close')" />
    </header>

    <template v-if="settings.settings.status === 'loaded'">
      <div class="row">
        <span class="label">{{ text.ui('options.trigger') }}</span>
        <TriggerOption
          :trigger="settings.settings.value.trigger"
          @choose="(trigger) => change({ trigger })"
          @recording="(active) => (recording = active)"
        />
      </div>

      <!-- One icon always stays: the one left can't be turned off. -->
      <div class="row" :title="text.ui('options.keepOneIcon')">
        <span class="label">{{ text.ui('options.icons') }}</span>
        <label class="check">
          <input
            type="checkbox"
            :checked="settings.settings.value.showMenuBarIcon"
            :disabled="!settings.settings.value.showDockIcon"
            @change="change({ showMenuBarIcon: checkedOf($event) })"
          />
          {{ text.ui('options.menuBarIcon') }}
        </label>
        <label class="check">
          <input
            type="checkbox"
            :checked="settings.settings.value.showDockIcon"
            :disabled="!settings.settings.value.showMenuBarIcon"
            @change="change({ showDockIcon: checkedOf($event) })"
          />
          {{ text.ui('options.dockIcon') }}
        </label>
      </div>

      <div class="row">
        <label class="label" for="launch-at-login">{{ text.ui('options.launchAtLogin') }}</label>
        <input
          id="launch-at-login"
          type="checkbox"
          :checked="settings.settings.value.launchAtLogin"
          @change="change({ launchAtLogin: checkedOf($event) })"
        />
      </div>
    </template>

    <div class="row">
      <label class="label" for="language">{{ text.ui('options.language') }}</label>
      <select
        v-if="settings.settings.status === 'loaded'"
        id="language"
        class="select"
        :value="settings.settings.value.language"
        @change="chooseLanguage"
      >
        <option value="system">{{ text.ui('options.system') }}</option>
        <option v-for="[value, name] in languages" :key="value" :value="value">{{ name }}</option>
      </select>
    </div>

    <div class="row">
      <span class="label">{{ text.ui('options.progress') }}</span>
      <BaseButton variant="danger" @click="reset">
        {{ text.ui(confirming ? 'options.confirmReset' : 'options.reset') }}
      </BaseButton>
    </div>

    <p v-if="failed" class="failed">{{ text.ui('options.saveFailed') }}</p>
  </section>
</template>

<style scoped>
.panel {
  padding: 32px;
  border-radius: 12px 12px 0 0;
  background-color: var(--color-dark-grey);
  font-size: 14px;
  font-weight: 500;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.row {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.label {
  flex: none;
  width: 120px;
  color: var(--color-text-muted);
  font-weight: 600;
}

.check {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  margin-right: 16px;
}

.select {
  padding: 4px 6px;
  border-radius: 6px;
  background-color: var(--color-surface);
}

.failed {
  color: var(--color-red);
}
</style>
