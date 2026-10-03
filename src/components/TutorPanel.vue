<script setup lang="ts">
import { inject, shallowRef } from 'vue';

import { plainText } from '@/domain/content/rich';
import type { Item } from '@/domain/content/types';
import { tutorKey } from '@/ports';

import BaseButton from './BaseButton.vue';
import RichText from './RichText.vue';

const { item, answer } = defineProps<{
  /** The item the learner just saw the answer of. */
  item: Item;
  /** What the learner wrote before revealing it, if anything. */
  answer: string;
}>();

const tutor = inject(tutorKey, undefined);
const reply = shallowRef('');
const state = shallowRef<'idle' | 'asking' | 'failed'>('idle');

/** The item's reference answer as the tutor reads it. */
function referenceOf(): string {
  switch (item.kind) {
    case 'definition':
    case 'theorem':
      return `${item.title}: ${item.statement}`;
    case 'claim':
      return `Behauptung: ${item.statement}\nSie ist ${item.holds ? 'wahr' : 'falsch'}. ${item.reason}`;
    case 'problem':
      return `Aufgabe: ${item.task}\nMusterlösung: ${item.solution}`;
  }
}

const rules =
  'Antworte auf Deutsch, knapp und freundlich, ohne Einleitung. Schreibe Formeln als TeX zwischen einfachen Dollarzeichen ($…$) und nutze sonst nur Fließtext, **fett** und Zeilen, die mit "- " beginnen.';

async function ask(prompt: string): Promise<void> {
  if (tutor?.value === undefined) {
    return;
  }

  state.value = 'asking';
  reply.value = '';

  try {
    reply.value = await tutor.value(prompt, (text) => {
      reply.value = text;
    });
    state.value = 'idle';
  } catch {
    state.value = 'failed';
  }
}

function check(): void {
  void ask(
    `Du bist Tutor für die Vorlesung Mathematik 2 (Analysis für Informatik). Eine Studentin hat aus dem Gedächtnis aufgeschrieben, was unten unter ANTWORT steht. Vergleiche es mit der REFERENZ aus dem Skript. Sage in höchstens 120 Wörtern: was stimmt, was fehlt (besonders Voraussetzungen und Quantoren) und was falsch ist. Schließe mit einem Urteil: "Gewusst" oder "Noch nicht". ${rules}\n\nREFERENZ:\n${referenceOf()}\n\nANTWORT:\n${answer}`,
  );
}

function explain(): void {
  void ask(
    `Du bist Tutor für die Vorlesung Mathematik 2 (Analysis für Informatik). Erkläre das Folgende anschaulich in höchstens 150 Wörtern: die Idee dahinter, wozu man es braucht, und ein kleines Beispiel oder eine typische Falle. ${rules}\n\n${referenceOf()}`,
  );
}
</script>

<template>
  <div>
    <section v-if="tutor !== undefined" class="tutor">
      <div class="actions">
        <BaseButton v-if="answer.trim().length > 0" :disabled="state === 'asking'" @click="check">
          Meine Antwort von Claude prüfen lassen
        </BaseButton>
        <BaseButton :disabled="state === 'asking'" @click="explain"
          >Von Claude erklären lassen</BaseButton
        >
      </div>
      <p v-if="state === 'asking' && reply === ''" class="status" aria-live="polite">
        Claude denkt nach …
      </p>
      <p v-if="state === 'failed'" class="status">
        Claude ist gerade nicht erreichbar. {{ plainText(reply) }}
      </p>
      <RichText v-if="reply !== '' && state !== 'failed'" class="reply" :source="reply" />
    </section>
  </div>
</template>

<style scoped>
.tutor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.reply {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-box);
  background-color: var(--color-box);
  font-size: 14px;
}
</style>
