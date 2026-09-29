<script setup lang="ts" generic="Pool">
import { computed, ref, watch } from 'vue';

import KeyCap from '@/components/KeyCap.vue';
import SkipButton from '@/components/SkipButton.vue';
import { useKeyLabels } from '@/composables/useKeyLabels';
import type { KeyCombination } from '@/domain/keyboard/combination';
import type { PracticeItem, Session } from '@/domain/practice/session';
import { useText } from '@/i18n';

import { announcementOf } from './announcement';
import { keyCapsOf } from './keyCaps';

const props = defineProps<{
  /** The app whose shortcuts are practiced, for their texts. */
  appId: string;
  /** The practice session to show. */
  session: Session<Pool>;
  /** The keys held right now. */
  held: KeyCombination;
  /** Whether a result couldn't be saved, shown as a notice. */
  saveFailed: boolean;
}>();

const emit = defineEmits<{
  /** Skip was clicked. */
  skip: [];
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
      <SkipButton @click="emit('skip')">{{ text.ui('practice.skip') }}</SkipButton>
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

.title {
  font-size: 24px;
  font-weight: 700;
}

.description {
  max-width: 350px;
  margin: 6px auto 0;
  font-size: 14px;
  font-weight: 600;
  opacity: 0.5;
}

.keys {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  margin-top: 20px;
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
  min-height: 16px;
}

.progress {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 700;
}

.save-failed {
  color: var(--color-red);
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
