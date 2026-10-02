<script setup lang="ts" generic="Pool">
import { computed, ref, watch } from 'vue';

import BaseButton from '@/components/BaseButton.vue';
import KeyCap from '@/components/KeyCap.vue';
import SkipButton from '@/components/SkipButton.vue';
import { useKeyLabels } from '@/composables/useKeyLabels';
import type { KeyCombination } from '@/domain/keyboard/combination';
import type { LearnStage } from '@/domain/practice/learn';
import type { PracticeItem, Session } from '@/domain/practice/session';
import { useText } from '@/i18n';

import { announcementOf } from './announcement';
import { keyCapsOf } from './keyCaps';
import StageBar from './StageBar.vue';

const props = defineProps<{
  /** The app whose shortcuts are practiced, for their texts. */
  appId: string;
  /** The practice session to show. */
  session: Session<Pool>;
  /** The keys held right now. */
  held: KeyCombination;
  /** Whether a result couldn't be saved, shown as a notice. */
  saveFailed: boolean;
  /** How far each shortcut of the session got, shown as a bar on top. */
  stages: readonly LearnStage[];
}>();

const emit = defineEmits<{
  /** Skip was clicked. */
  skip: [];
  /** Forgot was clicked: the shortcut being tested wasn't recalled. */
  forget: [];
}>();

defineSlots<{
  /** How far the session has come, shown at the bottom left. */
  progress: () => unknown;
}>();

const text = useText();
const labelOf = useKeyLabels();
const keyCaps = computed(() =>
  props.session.phase === 'finished' ? [] : keyCapsOf(props.session, props.held),
);

/** Whether a test is waiting for its keys, which can be forgotten. */
const canForget = computed(
  () =>
    props.session.phase === 'presenting' &&
    props.session.mode === 'testing' &&
    props.session.failure === undefined,
);

/** What VoiceOver announces for the current state, such as the shortcut and its keys. */
const announcement = computed(() => {
  const announced = announcementOf(props.session);

  return announced === undefined
    ? ''
    : text.ui(`practice.announce.${announced.kind}`, {
        title: text.app(props.appId, announced.item.title),
        keys: spokenKeys(announced.item),
      });
});

/** The keys as VoiceOver reads them: by their keycap names where they have one ("Cmd + K"). */
function spokenKeys({ keys }: PracticeItem): string {
  return keys
    .map((key) => {
      const label = labelOf(key);

      return label.name ?? label.symbol;
    })
    .join(' + ');
}

/** Plays the shake after a wrong answer; the animation's end clears it. */
const shaking = ref(false);

watch(
  () => (props.session.phase === 'presenting' ? props.session.misses : 0),
  (misses) => {
    shaking.value = misses > 0;
  },
);
</script>

<template>
  <div class="practice">
    <p class="visually-hidden" aria-live="polite">{{ announcement }}</p>

    <StageBar :stages="stages" />

    <Transition name="shortcut" mode="out-in">
      <div
        v-if="session.phase !== 'finished'"
        :key="session.presentation"
        class="shortcut"
        :class="{ shaking }"
        @animationend="shaking = false"
      >
        <h1 class="title">{{ text.app(appId, session.item.title) }}</h1>
        <p v-if="session.item.description !== undefined" class="description">
          {{ text.app(appId, session.item.description) }}
        </p>
        <!-- Announced instead: the key caps alone would read as symbols. -->
        <div class="keys" aria-hidden="true">
          <div v-for="(row, index) in keyCaps" :key="index" class="row">
            <KeyCap
              v-for="cap in row"
              :key="cap.key"
              :label="labelOf(cap.key)"
              :hidden="cap.hidden"
              :pressed="cap.pressed"
              :result="cap.result"
            />
          </div>
        </div>
      </div>
    </Transition>

    <footer class="footer">
      <div class="progress">
        <slot name="progress" />
        <span v-if="saveFailed" class="save-failed">{{ text.ui('practice.saveFailed') }}</span>
      </div>
      <div class="actions">
        <BaseButton v-if="canForget" @click="emit('forget')">
          {{ text.ui('practice.forgot') }}
        </BaseButton>
        <SkipButton @click="emit('skip')">{{ text.ui('practice.skip') }}</SkipButton>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.practice {
  display: flex;
  flex-direction: column;
  height: 100%;
  text-align: center;
}

.shortcut {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: center;
}

/* A short, damped shake after a wrong answer. */
.shaking {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

/* The prompt: the stage's one large text. */
.title {
  font-size: 30px;
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.description {
  max-width: 400px;
  margin: 8px auto 0;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.keys {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 36px;
  margin-top: 32px;
}

.row {
  display: inline-flex;
  gap: 8px;
}

.footer {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  min-height: 28px;
}

.progress {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.save-failed {
  color: var(--color-mistake);
}

.shortcut-enter-active,
.shortcut-leave-active {
  transition:
    transform 0.2s var(--ease-in-out-quad),
    opacity 0.2s var(--ease-in-out-quad);
}

.shortcut-enter-from {
  transform: translateX(10px);
  opacity: 0;
}

.shortcut-leave-to {
  transform: translateX(-10px);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .shaking {
    animation: none;
  }

  .shortcut-enter-active,
  .shortcut-leave-active {
    transition: none;
  }
}

@keyframes shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }

  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }

  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }

  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}
</style>
