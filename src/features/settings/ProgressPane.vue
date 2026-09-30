<script setup lang="ts">
import { onScopeDispose, ref } from 'vue';

import BaseButton from '@/components/BaseButton.vue';
import GroupedList from '@/components/GroupedList.vue';
import { useText } from '@/i18n';
import { useProgressStore } from '@/stores/progress';

import SettingRow from './SettingRow.vue';

const emit = defineEmits<{
  /** Resetting finished: whether it failed. */
  reset: [failed: boolean];
}>();

/** How long "Click again to reset" waits for the second click. */
const confirmMs = 3000;

const progress = useProgressStore();
const text = useText();
const confirming = ref(false);
const confirmTimer = ref<ReturnType<typeof setTimeout>>();

/** The first click asks for a second one; the second deletes all progress. */
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
  emit('reset', (await progress.reset()).kind === 'err');
}

onScopeDispose(() => {
  clearTimeout(confirmTimer.value);
});
</script>

<template>
  <GroupedList>
    <SettingRow :label="text.ui('settings.progress')" :hint="text.ui('settings.progressHint')">
      <BaseButton variant="danger" @click="reset">
        {{ text.ui(confirming ? 'settings.confirmReset' : 'settings.reset') }}
      </BaseButton>
    </SettingRow>
  </GroupedList>
</template>
