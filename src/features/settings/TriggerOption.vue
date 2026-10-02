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
}>();

const keymap = useKeymapStore();
const labelOf = useKeyLabels();
const text = useText();
const policy = triggerPolicy(macosReserved);

/** Why each rejected combination can't open the popover. */
const rejectionTexts: Readonly<Record<Rejection['reason'], UiKey>> = {
  'duplicate-key': 'settings.rejected.duplicateKey',
  'modifier-only': 'settings.rejected.modifierOnly',
  reserved: 'settings.rejected.reserved',
  'needs-modifier': 'settings.rejected.needsModifier',
  'app-standard': 'settings.rejected.appStandard',
};

const recording = ref(false);
const rejection = ref<Rejection>();

function startRecording(): void {
  recording.value = true;
  rejection.value = undefined;
  // Capturing, so the key doesn't also reach a button: Escape or Space would press it.
  window.addEventListener('keydown', onKeyDown, { capture: true });
}

function stopRecording(): void {
  window.removeEventListener('keydown', onKeyDown, { capture: true });
  recording.value = false;
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
        {{ text.ui('settings.holdCommand') }}
      </BaseButton>
      <BaseButton
        :variant="trigger.kind === 'shortcut' && !recording ? 'accent' : 'neutral'"
        :pressed="trigger.kind === 'shortcut'"
        @click="startRecording"
      >
        <template v-if="recording">{{ text.ui('settings.pressShortcut') }}</template>
        <span v-else-if="trigger.kind === 'shortcut'" class="keys">
          <KeyCapSmall v-for="key in trigger.keys" :key="key" :label="labelOf(key)" />
        </span>
        <template v-else>{{ text.ui('settings.recordShortcut') }}</template>
      </BaseButton>
    </div>
    <p v-if="recording && rejection" class="rejected" role="alert">
      {{ text.ui(rejectionTexts[rejection.reason]) }}
    </p>
  </div>
</template>

<style scoped>
.trigger {
  display: grid;
  justify-items: end;
  gap: 6px;
}

.choices {
  display: flex;
  gap: 8px;
}

/* On a chosen button, the keys take its text color. */
.keys {
  display: inline-flex;

  & > * {
    color: inherit;
  }
}

.rejected {
  max-width: 260px;
  color: var(--color-mistake);
  font-size: 11px;
  text-align: end;
}
</style>
