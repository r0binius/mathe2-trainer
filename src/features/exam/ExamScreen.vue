<script setup lang="ts">
import { computed, onScopeDispose, shallowRef } from 'vue';

import BaseButton from '@/components/BaseButton.vue';
import ItemCard from '@/components/ItemCard.vue';
import RichText from '@/components/RichText.vue';
import ScreenHeading from '@/components/ScreenHeading.vue';
import type { Topic } from '@/domain/content/types';
import type { ExamAnswers, ExamPlan, ExamTask } from '@/domain/exam/exam';
import {
  composeExam,
  defaultPlan,
  earned,
  examPlans,
  passShare,
  scoreExam,
} from '@/domain/exam/exam';
import { kindLabels, kindPrompts } from '@/labels';
import { useProgressStore } from '@/stores/progress';

const { topics } = defineProps<{
  /** Every topic an exam can cover. */
  topics: readonly Topic[];
}>();

const store = useProgressStore();

type Phase = 'setup' | 'running' | 'correcting' | 'result';
const phase = shallowRef<Phase>('setup');
const plan = shallowRef<ExamPlan>(defaultPlan);
const chosen = shallowRef<readonly string[]>(topics.map(({ id }) => id));
const tasks = shallowRef<readonly ExamTask[]>([]);
const answers = shallowRef<ExamAnswers>({ verdicts: {}, awarded: {} });
const startedAt = shallowRef(0);
const clock = shallowRef(Date.now());

const timer = window.setInterval(() => {
  clock.value = Date.now();
}, 1000);
onScopeDispose(() => {
  window.clearInterval(timer);
});

const remaining = computed(() =>
  Math.max(0, plan.value.minutes * 60 - Math.floor((clock.value - startedAt.value) / 1000)),
);
const remainingText = computed(() => {
  const minutes = Math.floor(remaining.value / 60);
  const seconds = remaining.value % 60;

  return `${String(minutes)}:${String(seconds).padStart(2, '0')}`;
});
const score = computed(() => scoreExam(tasks.value, answers.value));
const share = computed(() => (score.value.max === 0 ? 0 : score.value.points / score.value.max));

function toggle(id: string): void {
  chosen.value = chosen.value.includes(id)
    ? chosen.value.filter((other) => other !== id)
    : [...chosen.value, id];
}

function start(): void {
  tasks.value = composeExam(
    topics.filter(({ id }) => chosen.value.includes(id)),
    plan.value,
    Date.now(),
  );
  answers.value = { verdicts: {}, awarded: {} };
  startedAt.value = Date.now();
  clock.value = Date.now();
  phase.value = 'running';
  window.scrollTo(0, 0);
}

function judge(id: string, holds: boolean): void {
  answers.value = { ...answers.value, verdicts: { ...answers.value.verdicts, [id]: holds } };
}

function award(id: string, points: number): void {
  answers.value = { ...answers.value, awarded: { ...answers.value.awarded, [id]: points } };
}

function handIn(): void {
  phase.value = 'correcting';
  window.scrollTo(0, 0);
}

function finish(): void {
  store.examFinished({
    at: Date.now(),
    points: score.value.points,
    max: score.value.max,
    minutes: Math.round((Date.now() - startedAt.value) / 60_000),
  });
  phase.value = 'result';
  window.scrollTo(0, 0);
}

function pointChoices(task: ExamTask): readonly number[] {
  return Array.from({ length: task.points + 1 }, (_, index) => index);
}
</script>

<template>
  <div class="exam">
    <template v-if="phase === 'setup'">
      <ScreenHeading title="Prüfung simulieren">
        <template #meta>
          Zufällige Aufgaben aus allen Bereichen, auf Zeit. Du arbeitest auf Papier und korrigierst
          dich danach selbst anhand der Lösungen.
        </template>
      </ScreenHeading>

      <fieldset class="group">
        <legend class="caption">Umfang</legend>
        <label v-for="option in examPlans" :key="option.id" class="choice">
          <input v-model="plan" type="radio" name="plan" :value="option" />
          <span>
            <strong>{{ option.title }}</strong> – {{ option.minutes }} Minuten:
            {{ option.counts.definitions }} Definitionen, {{ option.counts.theorems }} Sätze,
            {{ option.counts.claims }} × wahr/falsch, {{ option.counts.problems }}
            {{ option.counts.problems === 1 ? 'Aufgabe' : 'Aufgaben' }}
          </span>
        </label>
      </fieldset>

      <fieldset class="group">
        <legend class="caption">Kapitel</legend>
        <label v-for="topic in topics" :key="topic.id" class="choice">
          <input
            type="checkbox"
            class="tick"
            :checked="chosen.includes(topic.id)"
            @change="toggle(topic.id)"
          />
          <span>{{ topic.chapter }} {{ topic.title }}</span>
        </label>
      </fieldset>

      <div class="action-bar">
        <BaseButton variant="accent" size="large" :disabled="chosen.length === 0" @click="start">
          Prüfung starten
        </BaseButton>
      </div>
    </template>

    <template v-else>
      <header class="bar">
        <strong>{{ plan.title }}</strong>
        <span v-if="phase === 'running'" class="time" :class="{ over: remaining === 0 }">
          {{ remaining === 0 ? 'Zeit ist um' : remainingText }}
        </span>
        <span v-else class="time">{{ score.points }} / {{ score.max }} Punkte</span>
        <BaseButton v-if="phase === 'running'" variant="accent" @click="handIn">Abgeben</BaseButton>
        <BaseButton v-else-if="phase === 'correcting'" variant="accent" @click="finish">
          Auswerten
        </BaseButton>
      </header>

      <section v-if="phase === 'result'" class="result">
        <p class="caption">Ergebnis</p>
        <h1 class="headline">{{ Math.round(share * 100) }} %</h1>
        <p class="verdict" :class="share >= passShare ? 'passed' : 'failed'">
          {{ score.points }} von {{ score.max }} Punkten –
          {{
            share >= passShare
              ? 'über der üblichen Bestehensgrenze von 50 %.'
              : 'unter der üblichen Bestehensgrenze von 50 %.'
          }}
        </p>
        <ul class="topics">
          <li v-for="row in score.byTopic" :key="row.topic.id" class="topic-row">
            <span>{{ row.topic.title }}</span>
            <span class="mono">{{ row.points }} / {{ row.max }}</span>
          </li>
        </ul>
        <div class="action-bar">
          <BaseButton size="large" @click="phase = 'setup'">Neue Prüfung</BaseButton>
        </div>
      </section>

      <p v-if="phase === 'correcting'" class="advice">
        Vergleiche deine Lösungen mit den Musterlösungen und gib dir ehrlich Punkte. „Wahr oder
        falsch“ ist schon ausgewertet.
      </p>

      <ol class="tasks">
        <li v-for="(task, index) in tasks" :key="task.item.id" class="task">
          <p class="caption">
            Aufgabe {{ index + 1 }} · {{ kindLabels[task.item.kind] }} · {{ task.points }}
            {{ task.points === 1 ? 'Punkt' : 'Punkte' }}
          </p>

          <template v-if="phase === 'running'">
            <template v-if="task.item.kind === 'definition' || task.item.kind === 'theorem'">
              <h2 class="title">{{ task.item.title }}</h2>
              <p class="prompt">{{ kindPrompts[task.item.kind] }}</p>
            </template>
            <template v-else-if="task.item.kind === 'claim'">
              <RichText :source="task.item.statement" />
              <div class="options">
                <BaseButton
                  :pressed="answers.verdicts[task.item.id] === true"
                  :variant="answers.verdicts[task.item.id] === true ? 'accent' : 'neutral'"
                  @click="judge(task.item.id, true)"
                >
                  Wahr
                </BaseButton>
                <BaseButton
                  :pressed="answers.verdicts[task.item.id] === false"
                  :variant="answers.verdicts[task.item.id] === false ? 'accent' : 'neutral'"
                  @click="judge(task.item.id, false)"
                >
                  Falsch
                </BaseButton>
              </div>
            </template>
            <template v-else-if="task.item.kind === 'problem'">
              <h2 class="title">{{ task.item.title }}</h2>
              <RichText :source="task.item.task" />
            </template>
          </template>

          <template v-else>
            <h2 v-if="task.item.kind !== 'claim'" class="title">{{ task.item.title }}</h2>
            <ItemCard :item="task.item" />
            <p v-if="task.item.kind === 'claim'" class="mine">
              Deine Antwort:
              {{
                answers.verdicts[task.item.id] === undefined
                  ? 'keine'
                  : answers.verdicts[task.item.id] === true
                    ? 'wahr'
                    : 'falsch'
              }}
              – {{ earned(task, answers) }} von 1 Punkt
            </p>
            <div v-else class="options" role="group" aria-label="Punkte">
              <span class="mine">Punkte:</span>
              <BaseButton
                v-for="points in pointChoices(task)"
                :key="points"
                :disabled="phase === 'result'"
                :pressed="(answers.awarded[task.item.id] ?? 0) === points"
                :variant="(answers.awarded[task.item.id] ?? 0) === points ? 'accent' : 'neutral'"
                @click="award(task.item.id, points)"
              >
                {{ points }}
              </BaseButton>
            </div>
          </template>
        </li>
      </ol>
    </template>
  </div>
</template>

<style scoped>
.exam {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  border: none;
}

.choice {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 6px 0;
  cursor: pointer;

  input {
    flex: none;
    cursor: pointer;
  }
}

/* Radios and ticks keep the system's look, in the action color. */
.choice input,
.tick {
  width: 16px;
  height: 16px;
  transform: translateY(2px);
  appearance: auto;
  accent-color: var(--color-action);
}

/* The exam's bar stays in view: the time left, and handing in. */
.bar {
  position: sticky;
  top: env(safe-area-inset-top, 0px);
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-box);
  background-color: var(--color-raised);
}

.time {
  flex: 1 1 auto;
  font-family: var(--font-mono);
  font-size: 16px;
  text-align: right;

  &.over {
    color: var(--color-mistake);
  }
}

.advice,
.prompt {
  color: var(--color-text-secondary);
}

.tasks {
  display: flex;
  flex-direction: column;
  gap: 10px;
  list-style: none;
}

.task {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-box);
  background-color: var(--color-box);
}

.title {
  font-size: 17px;
  font-weight: 600;
}

.options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.mine {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.result {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.headline {
  font-family: var(--font-mono);
  font-size: 48px;
  font-weight: 500;
  line-height: 1;
}

.verdict {
  &.passed {
    color: var(--color-learned);
  }

  &.failed {
    color: var(--color-mistake);
  }
}

.topics {
  max-width: 460px;
  list-style: none;
}

.topic-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 5px 0;
  border-bottom: 1px solid var(--color-border);
}

.mono {
  font-family: var(--font-mono);
}
</style>
