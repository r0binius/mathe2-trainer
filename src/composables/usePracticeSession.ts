import type { Ref } from 'vue';
import { inject, readonly, ref } from 'vue';

import type { KeyCombination } from '@/domain/keyboard/combination';
import type { Keymap } from '@/domain/keyboard/keymap';
import type {
  PracticeStrategy,
  ProgressEffect,
  Session,
  SessionEffect,
  SessionMsg,
} from '@/domain/practice/session';
import { startSession, updateSession } from '@/domain/practice/session';
import type { Result } from '@/domain/shared/result';
import type { StorageError } from '@/domain/shared/storage';
import { consoleLogger, loggerKey } from '@/ports';

import { useKeyCapture } from './useKeyCapture';
import { useProgram } from './useProgram';

/**
 * What a practice session needs from outside: the layout's keymap, where its results are saved,
 * and the clock and random numbers its messages carry. Tests pass fixed ones.
 */
export type PracticeShell = {
  readonly keymap: () => Keymap;
  readonly save: (effect: ProgressEffect) => Promise<Result<void, StorageError>>;
  readonly now: () => number;
  readonly random: () => number;
};

/** What a practice screen shows: the session, the keys held, and whether a save failed. */
export type PracticeView<Pool> = {
  readonly session: Readonly<Ref<Session<Pool>>>;
  readonly held: Readonly<Ref<KeyCombination>>;
  /** A result couldn't be saved. The session goes on, since the answers were still right. */
  readonly saveFailed: Readonly<Ref<boolean>>;
};

/**
 * Runs a practice session with the given strategy while the calling screen lives: key presses
 * answer, pauses become timers, and results are saved. Returns what to show, and how to skip the
 * current item.
 * @see §1.1 of `docs/architecture.md`
 */
export function usePracticeSession<Pool>(
  strategy: PracticeStrategy<Pool>,
  pool: Pool,
  shell: PracticeShell,
): readonly [view: PracticeView<Pool>, skip: () => void] {
  const { keymap, save, now, random } = shell;
  const saveFailed = ref(false);
  const logger = inject(loggerKey, consoleLogger);

  function run(effect: SessionEffect, dispatch: (msg: SessionMsg) => void, signal: AbortSignal) {
    switch (effect.type) {
      case 'advanceAfter': {
        const timer = setTimeout(() => {
          dispatch({ type: 'advance', presentation: effect.presentation, ...roll() });
        }, effect.ms);
        signal.addEventListener('abort', () => {
          clearTimeout(timer);
        });
        return;
      }
      case 'tested':
      case 'learnedChanged':
        void save(effect).then(reportFailure);
        return;
    }
  }

  function reportFailure(saved: Result<void, StorageError>): void {
    if (saved.kind === 'err') {
      saveFailed.value = true;
      logger.error(`Could not save practice progress: ${saved.error.message}`);
    }
  }

  function roll() {
    return { roll: random(), at: now() };
  }

  const [session, dispatch] = useProgram(startSession(strategy, pool, roll()), {
    update: (model, msg) => updateSession(strategy, model, msg),
    run,
  });

  const held = useKeyCapture(keymap, (keys) => {
    dispatch({ type: 'answer', keys, at: now() });
  });

  function skip(): void {
    dispatch({ type: 'skip', ...roll() });
  }

  return [{ session, held, saveFailed: readonly(saveFailed) }, skip];
}
