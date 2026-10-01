<script setup lang="ts">
import GroupedList from '@/components/GroupedList.vue';
import type { LanguageSetting } from '@/domain/settings/language';
import type { Settings } from '@/domain/settings/settings';
import { useText } from '@/i18n';

import SettingRow from './SettingRow.vue';

defineProps<{
  /** The settings in use. */
  settings: Settings;
}>();

const emit = defineEmits<{
  /** A control changed the setting it stands for. */
  change: [changes: Partial<Pick<Settings, 'language' | 'showMenuBarIcon' | 'showDockIcon'>>];
}>();

const text = useText();

/** Languages are named in themselves, so each is recognizable whatever the UI shows. */
const languages: readonly (readonly [LanguageSetting, string])[] = [
  ['en', 'English'],
  ['de', 'Deutsch'],
];

function chooseLanguage(event: Event): void {
  const select = event.target;

  if (select instanceof HTMLSelectElement) {
    emit('change', {
      language: languages.find(([value]) => value === select.value)?.[0] ?? 'system',
    });
  }
}

/** The checked state of a checkbox that changed. */
function checkedOf(event: Event): boolean {
  return event.target instanceof HTMLInputElement && event.target.checked;
}
</script>

<template>
  <GroupedList>
    <SettingRow :label="text.ui('settings.language')" label-for="language">
      <select id="language" :value="settings.language" @change="chooseLanguage">
        <option value="system">{{ text.ui('settings.system') }}</option>
        <option v-for="[value, name] in languages" :key="value" :value="value">{{ name }}</option>
      </select>
    </SettingRow>
  </GroupedList>

  <!-- One icon always stays: the one left can't be turned off. -->
  <GroupedList class="icons">
    <SettingRow
      :label="text.ui('settings.menuBarIcon')"
      label-for="menu-bar-icon"
      :hint="text.ui('settings.keepOneIcon')"
    >
      <input
        id="menu-bar-icon"
        type="checkbox"
        :checked="settings.showMenuBarIcon"
        :disabled="!settings.showDockIcon"
        @change="emit('change', { showMenuBarIcon: checkedOf($event) })"
      />
    </SettingRow>
    <SettingRow :label="text.ui('settings.dockIcon')" label-for="dock-icon">
      <input
        id="dock-icon"
        type="checkbox"
        :checked="settings.showDockIcon"
        :disabled="!settings.showMenuBarIcon"
        @change="emit('change', { showDockIcon: checkedOf($event) })"
      />
    </SettingRow>
  </GroupedList>
</template>

<style scoped>
.icons {
  margin-top: 16px;
}
</style>
