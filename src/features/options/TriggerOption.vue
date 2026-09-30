<script setup lang="ts">
import { onScopeDispose, ref } from 'vue';

import BaseButton from '@/components/BaseButton.vue';
import KeyCapSmall from '@/components/KeyCapSmall.vue';
import { keyPressOf } from '@/composables/useKeyCapture';
import { useKeyLabels } from '@/composables/useKeyLabels';
import { combinationOf } from '@/domain/keyboard/capture';
import type { Rejection } from '@/domain/keyboard/policy';
import { checkShortcut, macosReserved, triggerPolicy } from '@/domain/keyboard/policy';
import type { Trigger } from '@/domain/settings/settings';
import type { UiKey } from '@/i18n';
import { useText } from '@/i18n';
import { useKeymapStore } from '@/stores/keymap';

defineProps<{
  /** The trigger in use. */
  trigger: Trigger;
}>();

const emit = defineEmits<{
  /** A trigger was chosen: holding ⌘, or a recorded shortcut that the trigger policy allows. */
  choose: [trigger: Trigger];
  /** Recording started or stopped. Meanwhile Escape cancels it instead of closing the options. */
  recording: [active: boolean];
}>();

const keymap = useKeymapStore();
const labelOf = useKeyLabels();
const text = useText();
const policy = triggerPolicy(macosReserved);

/** Why each rejected combination can't open the popover. */
const rejectionTexts: Readonly<Record<Rejection['reason'], UiKey>> = {
  'duplicate-key': 'options.rejected.duplicateKey',
  'modifier-only': 'options.rejected.modifierOnly',
  reserved: 'options.rejected.reserved',
  'needs-modifier': 'options.rejected.needsModifier',
  'app-standard': 'options.rejected.appStandard',
};

const recording = ref(false);
const rejection = ref<Rejection>();

function startRecording(): void {
  recording.value = true;
  rejection.value = undefined;
  emit('recording', true);
  // After the options panel's own listener, which keeps keys from the screens behind it.
  window.addEventListener('keydown', onKeyDown, { capture: true });
}

function stopRecording(): void {
  window.removeEventListener('keydown', onKeyDown, { capture: true });
  recording.value = false;
  emit('recording', false);
}

function onKeyDown(event: KeyboardEvent): void {
  event.preventDefault();

  if (event.key === 'Escape') {
    stopRecording();
    return;
  }
  if (keymap.layout.status === 'loaded') {
    record(combinationOf(keymap.layout.value.keymap, keyPressOf(event)));
  }
}

function record(keys: readonly string[] | undefined): void {
  if (keys === undefined) {
    return;
  }

  const checked = checkShortcut(policy, keys);

  switch (checked.kind) {
    case 'ok':
      stopRecording();
      emit('choose', { kind: 'shortcut', keys: checked.value });
      return;
    case 'err':
      rejection.value = checked.error;
      return;
  }
}

onScopeDispose(() => {
  window.removeEventListener('keydown', onKeyDown, { capture: true });
});
</script>

<template>
  <div class="trigger">
    <div class="choices">
      <BaseButton
        :variant="trigger.kind === 'holdCommand' ? 'accent' : 'neutral'"
        :pressed="trigger.kind === 'holdCommand'"
        @click="emit('choose', { kind: 'holdCommand' })"
      >
        {{ text.ui('options.holdCommand') }}
      </BaseButton>
      <BaseButton
        :variant="trigger.kind === 'shortcut' && !recording ? 'accent' : 'neutral'"
        :pressed="trigger.kind === 'shortcut'"
        @click="startRecording"
      >
        <template v-if="recording">{{ text.ui('options.pressShortcut') }}</template>
        <span v-else-if="trigger.kind === 'shortcut'" class="keys">
          <KeyCapSmall v-for="key in trigger.keys" :key="key" :label="labelOf(key)" />
        </span>
        <template v-else>{{ text.ui('options.recordShortcut') }}</template>
      </BaseButton>
    </div>
    <p v-if="recording && rejection" class="rejected" role="alert">
      {{ text.ui(rejectionTexts[rejection.reason]) }}
    </p>
  </div>
</template>

<style scoped>
.choices {
  display: flex;
  gap: 8px;
}

.keys {
  display: inline-flex;
  gap: 4px;
}

.rejected {
  margin-top: 8px;
  color: var(--color-red);
}
</style>
