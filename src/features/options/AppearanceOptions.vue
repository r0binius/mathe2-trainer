<script setup lang="ts">
import type { Settings } from '@/domain/settings/settings';
import { useText } from '@/i18n';

import OptionRow from './OptionRow.vue';

defineProps<{
  /** The settings in use. */
  settings: Settings;
}>();

const emit = defineEmits<{
  /** A checkbox changed the setting it stands for. */
  change: [changes: Partial<Pick<Settings, 'showMenuBarIcon' | 'showDockIcon' | 'launchAtLogin'>>];
}>();

const text = useText();

/** The checked state of a checkbox that changed. */
function checkedOf(event: Event): boolean {
  return event.target instanceof HTMLInputElement && event.target.checked;
}
</script>

<template>
  <!-- One icon always stays: the one left can't be turned off. -->
  <OptionRow :label="text.ui('options.icons')" :hint="text.ui('options.keepOneIcon')">
    <label class="check">
      <input
        type="checkbox"
        :checked="settings.showMenuBarIcon"
        :disabled="!settings.showDockIcon"
        @change="emit('change', { showMenuBarIcon: checkedOf($event) })"
      />
      {{ text.ui('options.menuBarIcon') }}
    </label>
    <label class="check">
      <input
        type="checkbox"
        :checked="settings.showDockIcon"
        :disabled="!settings.showMenuBarIcon"
        @change="emit('change', { showDockIcon: checkedOf($event) })"
      />
      {{ text.ui('options.dockIcon') }}
    </label>
  </OptionRow>

  <OptionRow :label="text.ui('options.launchAtLogin')" label-for="launch-at-login">
    <input
      id="launch-at-login"
      type="checkbox"
      :checked="settings.launchAtLogin"
      @change="emit('change', { launchAtLogin: checkedOf($event) })"
    />
  </OptionRow>
</template>

<style scoped>
.check {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  margin-right: 16px;
}
</style>
