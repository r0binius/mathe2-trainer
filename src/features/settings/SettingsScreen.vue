<script setup lang="ts">
import { computed, shallowRef } from 'vue';

import BaseButton from '@/components/BaseButton.vue';
import KeyHint from '@/components/KeyHint.vue';
import ListSection from '@/components/ListSection.vue';
import ScreenHeading from '@/components/ScreenHeading.vue';
import { useProgressStore } from '@/stores/progress';

const store = useProgressStore();
const confirming = shallowRef(false);
const tests = computed(() => store.progress.log.length);

function reset(): void {
  if (confirming.value) {
    store.reset();
    confirming.value = false;
  } else {
    confirming.value = true;
  }
}

const keys: readonly (readonly [string, string])[] = [
  ['Leertaste', 'Aufdecken, Lösung zeigen, weiter'],
  ['1 – 4', 'Sich selbst bewerten (beim Lernen: 1 nicht gewusst, 2 gewusst)'],
  ['W / F', 'Aussage ist wahr / falsch'],
  ['T', 'Tipp zu einer Aufgabe'],
  ['S', 'Überspringen'],
  ['L', 'Deck lernen (in der Deck-Ansicht)'],
  ['/', 'Suchfeld beim Nachschlagen'],
  ['Esc', 'Zurück'],
];
</script>

<template>
  <div class="settings">
    <ScreenHeading title="Einstellungen" />

    <ListSection title="Fortschritt">
      <p class="text">
        {{ tests }} Antworten gespeichert,
        {{
          store.where() === 'account'
            ? 'in deinem Konto – dein Fortschritt folgt dir auf andere Geräte.'
            : 'in diesem Browser.'
        }}
      </p>
      <div class="row">
        <BaseButton variant="danger" @click="reset">
          {{ confirming ? 'Wirklich alles löschen?' : 'Fortschritt zurücksetzen' }}
        </BaseButton>
        <BaseButton v-if="confirming" @click="confirming = false">Abbrechen</BaseButton>
      </div>
    </ListSection>

    <ListSection title="Tastatur">
      <dl class="keys">
        <div v-for="[key, what] in keys" :key="key" class="key-row">
          <dt><KeyHint :label="key" /></dt>
          <dd>{{ what }}</dd>
        </div>
      </dl>
    </ListSection>

    <ListSection title="So lernt der Trainer mit dir">
      <p class="text">
        Neue Definitionen und Sätze siehst du zuerst mit Lösung, danach wirst du abgefragt, bis du
        sie zweimal hintereinander gewusst hast. Was du gewusst hast, bekommt einen
        Wiederholungstermin (FSRS): erst nach einem Tag, dann in wachsenden Abständen – und früher,
        wenn du danebenliegst. Inhalte und Nummern folgen dem Skript, Kapitel 7 bis 13, und den
        Übungsblättern 1 bis 8.
      </p>
    </ListSection>
  </div>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.text {
  max-width: 62ch;
  color: var(--color-text-secondary);
}

.row {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.keys {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.key-row {
  display: flex;
  align-items: baseline;
  gap: 12px;

  dt {
    flex: none;
    width: 84px;
  }
}

/* Here the keys are the content, so they show on touch screens too. */
.key-row :deep(.key) {
  display: inline-flex;
}
</style>
