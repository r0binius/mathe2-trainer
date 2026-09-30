<script setup lang="ts">
import GroupedList from '@/components/GroupedList.vue';
import type { Trigger } from '@/domain/settings/settings';
import { useText } from '@/i18n';

import SettingRow from './SettingRow.vue';
import TriggerOption from './TriggerOption.vue';

defineProps<{
  /** The trigger in use. */
  trigger: Trigger;
}>();

const emit = defineEmits<{
  /** Another trigger was chosen. */
  choose: [trigger: Trigger];
}>();

const text = useText();
</script>

<template>
  <GroupedList>
    <SettingRow :label="text.ui('settings.trigger')" :hint="text.ui('settings.triggerHint')">
      <TriggerOption :trigger="trigger" @choose="(chosen) => emit('choose', chosen)" />
    </SettingRow>
  </GroupedList>
</template>
