<script setup lang="ts">
import { computed } from 'vue';

import BaseButton from '@/components/BaseButton.vue';
import BaseIcon from '@/components/BaseIcon.vue';
import GroupedList from '@/components/GroupedList.vue';
import type { CoachAccess, Permission } from '@/domain/settings/coachAccess';
import { missingPermissions } from '@/domain/settings/coachAccess';
import type { LanguageSetting } from '@/domain/settings/language';
import type { Settings } from '@/domain/settings/settings';
import { useText } from '@/i18n';

import SettingRow from './SettingRow.vue';

const props = defineProps<{
  /** The settings in use. */
  settings: Settings;
  /** What learning from work needs the user to allow; unknown until it's asked. */
  coachAccess?: CoachAccess | undefined;
}>();

const emit = defineEmits<{
  /** A control changed the setting it stands for. */
  change: [
    changes: Partial<
      Pick<Settings, 'language' | 'showMenuBarIcon' | 'showDockIcon' | 'learnFromWork'>
    >,
  ];
  /** Open System Settings was clicked for a permission that's missing. */
  ask: [permission: Permission];
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

/** What learning from work still needs the user to allow, while it's on. */
const missing = computed(() =>
  props.settings.learnFromWork && props.coachAccess !== undefined
    ? missingPermissions(props.coachAccess)
    : [],
);

/** The checked state of a checkbox that changed. */
function checkedOf(event: Event): boolean {
  return event.target instanceof HTMLInputElement && event.target.checked;
}
</script>

<template>
  <GroupedList>
    <SettingRow :label="text.ui('settings.language')" label-for="language">
      <!-- A flat menu button; the chevron stands in for the system's arrows. -->
      <span class="select">
        <select id="language" :value="settings.language" @change="chooseLanguage">
          <option value="system">{{ text.ui('settings.system') }}</option>
          <option v-for="[value, name] in languages" :key="value" :value="value">
            {{ name }}
          </option>
        </select>
        <BaseIcon class="chevron" name="chevronDown" :size="10" />
      </span>
    </SettingRow>
  </GroupedList>

  <!-- One icon always stays: the one left can't be turned off. -->
  <GroupedList class="group">
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

  <GroupedList class="group">
    <SettingRow
      :label="text.ui('settings.learnFromWork')"
      label-for="learn-from-work"
      :hint="text.ui('settings.learnFromWorkHint')"
    >
      <input
        id="learn-from-work"
        type="checkbox"
        :checked="settings.learnFromWork"
        @change="emit('change', { learnFromWork: checkedOf($event) })"
      />
    </SettingRow>
    <!-- Watching waits until both are allowed; each missing one gets its own way there. -->
    <SettingRow
      v-for="permission in missing"
      :key="permission"
      :label="text.ui(`settings.missing.${permission}`)"
    >
      <BaseButton @click="emit('ask', permission)">
        {{ text.ui('settings.openSystemSettings') }}
      </BaseButton>
    </SettingRow>
  </GroupedList>
</template>

<style scoped>
.group {
  margin-top: 12px;
}

.select {
  position: relative;
  display: inline-flex;
}

select {
  height: 24px;
  padding: 0 24px 0 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background-color: var(--color-raised);
  color: var(--color-text);
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  appearance: none;
}

.chevron {
  position: absolute;
  top: 50%;
  right: 8px;
  color: var(--color-text-secondary);
  transform: translateY(-50%);
  pointer-events: none;
}
</style>
