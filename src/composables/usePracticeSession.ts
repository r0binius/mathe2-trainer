import type { ShallowRef } from 'vue';

import type {
  PracticeStrategy,
  ProgressEffect,
  Session,
  SessionMsg,
} from '@/domain/practice/session';
import { startSession, updateSession } from '@/domain/practice/session';
import type { Grade } from '@/domain/scheduling/scheduler';
import { useProgressStore } from '@/stores/progress';

import { useProgram } from './useProgram';

/** A running practice session, and what the learner can do in it. */
// eslint-disable-next-line functional/no-mixed-types -- the model to render next to what changes it, as `useProgram` returns them
export type PracticeSession<Pool> = {
  readonly session: Readonly<ShallowRef<Session<Pool>>>;
  readonly reveal: () => void;
  readonly judge: (holds: boolean) => void;
  readonly grade: (grade: Grade) => void;
  readonly proceed: () => void;
  readonly skip: () => void;
};

/**
 * Runs a practice session as an Elm program: the pure session decides, and this shell rolls the
 * dice, reads the clock and saves the results to the progress store.
 */
export function usePracticeSession<Pool>(
  strategy: PracticeStrategy<Pool>,
  pool: Pool,
): PracticeSession<Pool> {
  const store = useProgressStore();
  const [session, dispatch] = useProgram<Session<Pool>, SessionMsg, ProgressEffect>(
    startSession(strategy, pool, Math.random()),
    {
      update: (model, msg) => updateSession(strategy, model, msg),
      run: (effect) => {
        if (effect.type === 'tested') {
          store.tested(effect.id, effect.grade, effect.at);
        } else {
          store.learningChanged(effect.snapshot);
        }
      },
    },
  );

  function rolled(): { readonly roll: number; readonly at: number } {
    return { roll: Math.random(), at: Date.now() };
  }

  return {
    session,
    reveal: () => {
      dispatch({ type: 'reveal' });
    },
    judge: (holds) => {
      dispatch({ type: 'judge', holds, at: Date.now() });
    },
    grade: (grade) => {
      dispatch({ type: 'grade', grade, ...rolled() });
    },
    proceed: () => {
      dispatch({ type: 'continue', ...rolled() });
    },
    skip: () => {
      dispatch({ type: 'skip', ...rolled() });
    },
  };
}
