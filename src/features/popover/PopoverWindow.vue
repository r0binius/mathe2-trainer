<script setup lang="ts">
import { inject, onScopeDispose } from 'vue';

import { useText } from '@/i18n';
import { consoleLogger, loggerKey, missingWindows, windowsKey } from '@/ports';

const text = useText();
const windows = inject(windowsKey, missingWindows);
const logger = inject(loggerKey, consoleLogger);

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

window.addEventListener('keydown', onKeyDown);

onScopeDispose(() => {
  window.removeEventListener('keydown', onKeyDown);
});
</script>

<template>
  <!-- A placeholder until the lookup (step 8) shows the shortcuts of the app in front. -->
  <main class="popover">
    <p>{{ text.ui('popover.placeholder') }}</p>
  </main>
</template>

<style scoped>
.popover {
  display: grid;
  place-items: center;
  height: 100vh;
  padding: 24px;
  color: var(--color-label-secondary);
  text-align: center;
}
</style>
