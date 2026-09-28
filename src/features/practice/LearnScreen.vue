<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import BaseButton from '@/components/BaseButton.vue';
import CircleProgress from '@/components/CircleProgress.vue';
import KeyCap from '@/components/KeyCap.vue';
import PageLayout from '@/components/PageLayout.vue';
import SkipButton from '@/components/SkipButton.vue';
import { usePracticeSession } from '@/composables/usePracticeSession';
import { labelKey, macosKeyLabels } from '@/domain/keyboard/labels';
import { practiceItems } from '@/domain/practice/items';
import { learnPool, learnStrategy } from '@/domain/practice/learn';
import type { SummaryContext } from '@/domain/progress/summary';
import { summarizeSet } from '@/domain/progress/summary';
import type { AppDefinition, ShortcutSet } from '@/domain/shortcuts/types';
import { useText } from '@/i18n';
import { toSet } from '@/router';
import { useProgressStore } from '@/stores/progress';

import { keyCapsOf } from './keyCaps';
import { progressSaver } from './progressSaver';

const props = defineProps<{
  /** The app the set belongs to. */
  app: AppDefinition;
  /** The set to learn. */
  set: ShortcutSet;
  /** The layout, policy and stored progress the session starts from. */
  context: SummaryContext;
}>();

const router = useRouter();
const text = useText();
const target = { appId: props.app.id, setId: props.set.id, layout: props.context.layout };

// The session starts from the progress as it is now, and owns it from then on.
const [view, skip] = usePracticeSession(
  learnStrategy,
  learnPool(
    practiceItems(props.app.id, props.set, props.context),
    summarizeSet(props.app.id, props.set, props.context).learned,
  ),
  {
    keymap: () => props.context.keymap,
    save: progressSaver(useProgressStore(), target, Date.now),
    now: Date.now,
    random: Math.random,
  },
);

const { session, held, saveFailed } = view;
const keyCaps = computed(() =>
  session.value.phase === 'finished' ? [] : keyCapsOf(session.value, held.value),
);
const learned = computed(
  () => session.value.pool.entries.filter(({ stage }) => stage === 'learned').length,
);

/** Plays the shake after a wrong answer; the animation's end clears it. */
const shaking = ref(false);
/** The learned count to announce, while its message shows. */
const announced = ref<number>();

watch(
  () => (session.value.phase === 'presenting' ? session.value.misses : 0),
  (misses) => {
    shaking.value = misses > 0;
  },
);

watch(learned, (count) => {
  announced.value = count;
});

watch(
  () => session.value.phase,
  (phase) => {
    if (phase === 'finished') {
      void router.push(toSet(props.app.id, props.set.id));
    }
  },
  { immediate: true },
);
</script>

<template>
  <PageLayout :title="app.title" :subtitle="text.app(app.id, set.title)">
    <template #start>
      <BaseButton icon="arrowLeft" @click="router.push(toSet(app.id, set.id))">
        {{ text.ui('learn.back') }}
      </BaseButton>
    </template>

    <div class="practice">
      <Transition name="shortcut" mode="out-in">
        <div
          v-if="session.phase !== 'finished'"
          :key="session.presentation"
          class="shortcut"
          :class="{ shaking }"
          @animationend="shaking = false"
        >
          <h1 class="title">{{ text.app(app.id, session.item.title) }}</h1>
          <p v-if="session.item.description !== undefined" class="description">
            {{ text.app(app.id, session.item.description) }}
          </p>
          <div class="keys">
            <div v-for="(row, index) in keyCaps" :key="index" class="row">
              <KeyCap
                v-for="cap in row"
                :key="cap.key"
                :label="labelKey(macosKeyLabels, cap.key)"
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
          <CircleProgress v-if="learned > 0" :value="learned" :max="session.pool.entries.length" />
          <span
            v-if="announced !== undefined"
            :key="announced"
            class="announcement"
            @animationend="announced = undefined"
          >
            {{ text.ui('learn.mastered', { n: announced }) }}
          </span>
          <span v-if="saveFailed" class="save-failed">
            {{ text.ui('practice.saveFailed') }}
          </span>
        </div>
        <SkipButton @click="skip">{{ text.ui('practice.skip') }}</SkipButton>
      </footer>
    </div>
  </PageLayout>
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
  font-size: 12px;
  font-weight: 700;
}

/* Shows for three seconds, then fades; its end removes it. */
.announcement {
  opacity: 0.5;
  animation: announce 3s both;
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

@keyframes announce {
  0% {
    transform: translateX(-8px);
    opacity: 0;
  }

  7%,
  93% {
    transform: none;
    opacity: 0.5;
  }

  100% {
    transform: translateX(8px);
    opacity: 0;
  }
}
</style>
