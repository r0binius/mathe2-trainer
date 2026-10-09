<script setup lang="ts">
import { shallowRef } from 'vue';

import BaseButton from '@/components/BaseButton.vue';
import { canSync, hideSyncHintUntil, syncHintHidden, syncKey } from '@/platform/storage';
import { toSettings } from '@/routes';
import { useProgressStore } from '@/stores/progress';

const store = useProgressStore();
const week = 7 * 24 * 60 * 60 * 1000;
const hidden = shallowRef(syncHintHidden(Date.now()));
/** A key is stored, yet the progress did not reach the server: wrong key, or offline. */
const failed = syncKey() !== '';

function later(): void {
  hideSyncHintUntil(Date.now() + week);
  hidden.value = true;
}
</script>

<template>
  <div class="root">
    <aside v-if="canSync() && store.where() === 'browser' && (failed || !hidden)" class="hint">
      <template v-if="failed">
        <p class="title">Die Synchronisierung hat nicht geklappt.</p>
        <p class="text">
          Prüfe den Sync-Schlüssel in den Einstellungen und ob du online bist. Bis dahin liegt dein
          Fortschritt nur in diesem Browser.
        </p>
      </template>
      <template v-else>
        <p class="title">Dein Fortschritt liegt nur in diesem Browser.</p>
        <p class="text">
          Wechselst du das Gerät oder löschst die Browserdaten, ist er weg. Erzeuge in den
          Einstellungen einen Sync-Schlüssel und trage ihn auf deinem anderen Gerät ein.
        </p>
      </template>
      <div class="buttons">
        <RouterLink v-slot="{ navigate }" :to="toSettings()" custom>
          <BaseButton variant="accent" @click="navigate">
            {{ failed ? 'Einstellungen öffnen' : 'Synchronisieren einrichten' }}
          </BaseButton>
        </RouterLink>
        <BaseButton v-if="!failed" @click="later">Später</BaseButton>
      </div>
    </aside>
  </div>
</template>

<style scoped>
/* Takes no space of its own while the hint is hidden, so no gap is left in a column. */
.root {
  display: contents;
}

.hint {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-due);
  border-radius: var(--radius-box);
  background-color: var(--color-box);
}

.title {
  font-weight: 600;
}

.text {
  color: var(--color-text-secondary);
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}
</style>
