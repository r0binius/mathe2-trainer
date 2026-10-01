<script setup lang="ts">
import { inject, onScopeDispose, ref } from 'vue';

import BaseButton from '@/components/BaseButton.vue';
import type { PopoverOpened } from '@/domain/lookup/appInFront';
import { useText } from '@/i18n';
import {
  consoleLogger,
  loggerKey,
  lookupKey,
  missingLookup,
  missingWindows,
  windowsKey,
} from '@/ports';

const text = useText();
const windows = inject(windowsKey, missingWindows);
const lookup = inject(lookupKey, missingLookup);
const logger = inject(loggerKey, consoleLogger);

/** What the popover opened over last; nothing until it first opens. */
const opened = ref<PopoverOpened>();

const stopFollowing = lookup.onPopoverOpened((latest) => {
  opened.value = latest;
});

// Escape closes the popover, like a menu.
function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    void dismiss();
  }
}

async function dismiss(): Promise<void> {
  const dismissed = await windows.dismissPopover();

  if (dismissed.kind === 'err') {
    logger.error(`Could not close the popover: ${dismissed.error.message}`);
  }
}

// System Settings comes to the front, which closes the popover.
async function askForMenuAccess(): Promise<void> {
  const asked = await lookup.askForMenuAccess();

  if (asked.kind === 'err') {
    logger.error(`Could not ask for access to the menus: ${asked.error.message}`);
  }
}

window.addEventListener('keydown', onKeyDown);

onScopeDispose(() => {
  window.removeEventListener('keydown', onKeyDown);
  stopFollowing();
});
</script>

<template>
  <main class="popover">
    <p v-if="opened?.app === undefined">{{ text.ui('popover.noApp') }}</p>
    <template v-else>
      <h1 class="app">{{ opened.app.name }}</h1>
      <template v-if="opened.menuAccess === 'denied'">
        <p>{{ text.ui('popover.accessHint', { app: opened.app.name }) }}</p>
        <BaseButton variant="accent" @click="askForMenuAccess">
          {{ text.ui('popover.openSettings') }}
        </BaseButton>
      </template>
      <!-- A placeholder until the lookup (8.2, 8.3) shows the app's shortcuts. -->
      <p v-else>{{ text.ui('popover.placeholder', { app: opened.app.name }) }}</p>
    </template>
  </main>
</template>

<style scoped>
.popover {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 12px;
  height: 100vh;
  padding: 24px;
  color: var(--color-label-secondary);
  text-align: center;
}

.app {
  color: var(--color-label);
  font-size: 15px;
  font-weight: 600;
}
</style>
