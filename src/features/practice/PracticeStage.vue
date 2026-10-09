<script setup lang="ts" generic="Pool">
import { computed, shallowRef, watch } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { useRouter } from 'vue-router';

import BaseButton from '@/components/BaseButton.vue';
import KeyHint from '@/components/KeyHint.vue';
import RichText from '@/components/RichText.vue';
import TutorPanel from '@/components/TutorPanel.vue';
import { useHotkeys } from '@/composables/useHotkeys';
import type { PracticeSession } from '@/composables/usePracticeSession';
import type { LearnStep } from '@/domain/practice/learn';
import type { Grade } from '@/domain/scheduling/scheduler';
import { kindLabels, kindPrompts } from '@/labels';
import { useProgressStore } from '@/stores/progress';

import StageBar from './StageBar.vue';

const { practice, grades, back } = defineProps<{
  /** The running session and what can be done in it. */
  practice: PracticeSession<Pool>;
  /** How far each item of the session got, shown as a bar on top. */
  steps: readonly LearnStep[];
  /** Where the session is, such as the topic, deck and mode. */
  context: string;
  /** The grades the learner can give themselves: two while learning, four while reviewing. */
  grades: readonly Grade[];
  /** Where Escape leads. */
  back: RouteLocationRaw;
}>();

defineSlots<{
  /** How far the session has come, shown at the bottom left. */
  progress: () => unknown;
}>();

const store = useProgressStore();
const router = useRouter();
const session = computed(() => practice.session.value);

/** What the learner wrote down before revealing the answer, and whether a hint is shown. */
const answer = shallowRef('');
const hinted = shallowRef(false);

watch(
  () => (session.value.phase === 'finished' ? 0 : session.value.presentation),
  () => {
    answer.value = '';
    hinted.value = false;
  },
);

const gradeLabels: Readonly<Record<Grade, string>> = {
  again: 'Nicht gewusst',
  hard: 'Mit Mühe',
  good: 'Gewusst',
  easy: 'Sofort gewusst',
};

/** What the current state waits for, which decides the buttons and the keys. */
const waitsFor = computed(() => {
  const current = session.value;

  if (current.phase === 'finished') {
    return 'nothing';
  }
  if (current.phase === 'revealed') {
    return current.judgedCorrectly === undefined ? 'grade' : 'continue';
  }
  if (current.mode === 'training') {
    return 'continue';
  }

  return current.item.kind === 'claim' ? 'verdict' : 'reveal';
});

function gradeAt(index: number): (() => void) | undefined {
  const grade = grades[index];

  return waitsFor.value === 'grade' && grade !== undefined
    ? () => {
        practice.grade(grade);
      }
    : undefined;
}

function judgeAs(holds: boolean): (() => void) | undefined {
  return waitsFor.value === 'verdict'
    ? () => {
        practice.judge(holds);
      }
    : undefined;
}

function primary(): void {
  if (waitsFor.value === 'reveal') {
    practice.reveal();
  } else if (waitsFor.value === 'continue') {
    practice.proceed();
  }
}

useHotkeys(() => ({
  Space: primary,
  Enter: primary,
  w: judgeAs(true),
  f: judgeAs(false),
  t: () => {
    hinted.value = true;
  },
  s: practice.skip,
  '1': gradeAt(0),
  '2': gradeAt(1),
  '3': gradeAt(2),
  '4': gradeAt(3),
  Escape: () => {
    void router.push(back);
  },
}));
</script>

<template>
  <div class="practice">
    <p class="context caption">{{ context }}</p>
    <StageBar :steps="steps" />

    <Transition name="item" mode="out-in">
      <div v-if="session.phase !== 'finished'" :key="session.presentation" class="item">
        <p class="kind caption">
          {{ kindLabels[session.item.kind] }}
          <template v-if="session.phase === 'asking' && session.mode === 'training'">
            – neu, einprägen
          </template>
        </p>

        <!-- A definition or theorem: its name asks, its statement answers. -->
        <template v-if="session.item.kind === 'definition' || session.item.kind === 'theorem'">
          <h1 class="title">{{ session.item.title }}</h1>
          <template v-if="waitsFor === 'reveal'">
            <p class="prompt">{{ kindPrompts[session.item.kind] }}</p>
            <textarea
              v-model="answer"
              class="answer"
              rows="3"
              placeholder="Sag es dir laut vor oder schreib es auf – hier oder auf Papier."
              aria-label="Deine Antwort"
            />
          </template>
          <div v-else class="solution">
            <RichText :source="session.item.statement" />
            <aside v-if="session.item.note !== undefined" class="note">
              <RichText :source="session.item.note" />
            </aside>
            <p v-if="session.item.ref !== undefined" class="ref">Skript: {{ session.item.ref }}</p>
          </div>
        </template>

        <!-- A claim: judged true or false, then its reason. -->
        <template v-else-if="session.item.kind === 'claim'">
          <RichText class="claim" :source="session.item.statement" />
          <div v-if="session.phase === 'revealed'" class="solution">
            <p class="verdict" :class="session.judgedCorrectly === true ? 'right' : 'wrong'">
              {{ session.judgedCorrectly === true ? 'Richtig' : 'Leider nicht' }} – die Aussage ist
              {{ session.item.holds ? 'wahr' : 'falsch' }}.
            </p>
            <RichText :source="session.item.reason" />
            <p v-if="session.item.ref !== undefined" class="ref">Skript: {{ session.item.ref }}</p>
          </div>
        </template>

        <!-- A problem: solved on paper, then compared with the worked solution. -->
        <template v-else-if="session.item.kind === 'problem'">
          <h1 class="title small">{{ session.item.title }}</h1>
          <RichText class="task" :source="session.item.task" />
          <aside v-if="hinted && session.item.hint !== undefined" class="note">
            <RichText :source="session.item.hint" />
          </aside>
          <div v-if="session.phase === 'revealed'" class="solution">
            <h2 class="caption">Lösung</h2>
            <RichText :source="session.item.solution" />
          </div>
          <p class="ref">
            {{ session.item.points }} Punkte<template v-if="session.item.source !== undefined"
              >, {{ session.item.source }}</template
            >
          </p>
        </template>

        <div class="actions">
          <template v-if="waitsFor === 'verdict'">
            <BaseButton size="large" @click="practice.judge(true)">
              Wahr <KeyHint label="W" />
            </BaseButton>
            <BaseButton size="large" @click="practice.judge(false)">
              Falsch <KeyHint label="F" />
            </BaseButton>
          </template>
          <template v-else-if="waitsFor === 'reveal'">
            <BaseButton
              v-if="session.item.kind === 'problem' && session.item.hint !== undefined && !hinted"
              size="large"
              @click="hinted = true"
            >
              Tipp <KeyHint label="T" />
            </BaseButton>
            <BaseButton variant="accent" size="large" @click="practice.reveal()">
              {{ session.item.kind === 'problem' ? 'Lösung zeigen' : 'Aufdecken' }}
              <KeyHint label="Leertaste" />
            </BaseButton>
          </template>
          <template v-else-if="waitsFor === 'grade'">
            <BaseButton
              v-for="(grade, index) in grades"
              :key="grade"
              size="large"
              :variant="grade === 'again' ? 'danger' : 'neutral'"
              @click="practice.grade(grade)"
            >
              {{ gradeLabels[grade] }} <KeyHint :label="String(index + 1)" />
            </BaseButton>
          </template>
          <BaseButton v-else variant="accent" size="large" @click="practice.proceed()">
            Weiter <KeyHint label="Leertaste" />
          </BaseButton>
        </div>

        <TutorPanel v-if="session.phase === 'revealed'" :item="session.item" :answer="answer" />
      </div>
    </Transition>

    <footer class="footer">
      <div class="progress">
        <slot name="progress" />
        <span v-if="store.saveFailed" class="save-failed">
          Fortschritt konnte nicht gespeichert werden
        </span>
      </div>
      <BaseButton variant="toolbar" icon="skip" @click="practice.skip()">
        Überspringen <KeyHint label="S" />
      </BaseButton>
    </footer>
  </div>
</template>

<style scoped>
.practice {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 100%;
}

.context {
  text-align: center;
}

.item {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  padding: 24px 0;
}

.kind {
  color: var(--color-action);
}

/* The prompt: the stage's one large text. */
.title {
  font-size: clamp(22px, 4.5vw, 30px);
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.2;

  &.small {
    font-size: 20px;
  }
}

.prompt {
  color: var(--color-text-secondary);
}

.claim {
  font-size: 18px;
  line-height: 1.5;
}

.answer {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-box);
  background-color: var(--color-box);
  color: inherit;
  font: inherit;
  resize: vertical;
}

.solution {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-box);
  background-color: var(--color-box);
}

.note {
  padding-left: 10px;
  border-left: 2px solid var(--color-due);
  color: var(--color-text-secondary);
  font-size: 0.93em;
}

.ref {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.verdict {
  font-weight: 600;

  &.right {
    color: var(--color-learned);
  }

  &.wrong {
    color: var(--color-mistake);
  }
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.footer {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--color-border);
}

.progress {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.save-failed {
  color: var(--color-mistake);
}

.item-enter-active,
.item-leave-active {
  transition:
    transform 0.18s var(--ease-in-out-quad),
    opacity 0.18s var(--ease-in-out-quad);
}

.item-enter-from {
  transform: translateX(10px);
  opacity: 0;
}

.item-leave-to {
  transform: translateX(-10px);
  opacity: 0;
}

/*
 * On a phone a solution can be longer than the screen: the buttons that answer stay at the bottom
 * edge instead of waiting below it.
 */
@media (max-width: 760px) {
  .item {
    padding: 14px 0 0;
  }

  .actions {
    position: sticky;
    bottom: 0;
    z-index: 1;
    margin: 0 -16px;
    padding: 10px 16px calc(10px + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid var(--color-border);
    background-color: var(--color-content);
  }

  .actions > * {
    flex: 1 1 0;
  }

  .footer {
    padding-bottom: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .item-enter-active,
  .item-leave-active {
    transition: none;
  }
}
</style>
