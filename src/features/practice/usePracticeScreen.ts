import type { PracticeActions, PracticeView } from '@/composables/usePracticeSession';
import { usePracticeSession } from '@/composables/usePracticeSession';
import type { PracticeStrategy } from '@/domain/practice/session';
import type { SummaryContext } from '@/domain/progress/summary';
import { useProgressStore } from '@/stores/progress';

import type { SaveTarget } from './progressSaver';
import { progressSaver } from './progressSaver';
import { useSessionExit } from './useSessionExit';

/** What a practice screen practices: the strategy, the pool it starts from, and where results go. */
export type Practice<Pool> = {
  readonly strategy: PracticeStrategy<Pool>;
  readonly pool: Pool;
  readonly target: SaveTarget;
};

/** How a practice screen hooks in: the context it shows, and how it leaves. */
export type PracticeScreen = {
  /** The layout and progress the screen shows; its keymap is read at each key. */
  readonly context: () => SummaryContext;
  /** Goes back to where the practice started, once the session is over. */
  readonly leave: () => void;
};

/**
 * Runs a practice screen's session: keys on the context's layout, results saved into the progress
 * store at the system's time, random rolls from `Math.random`, and leaving once the session is
 * over or the progress and layout it started from change. Returns what to show, and the actions.
 */
export function usePracticeScreen<Pool>(
  { strategy, pool, target }: Practice<Pool>,
  { context, leave }: PracticeScreen,
): readonly [view: PracticeView<Pool>, actions: PracticeActions] {
  const progress = useProgressStore();
  const [view, actions] = usePracticeSession(strategy, pool, {
    keymap: () => context().keymap,
    save: progressSaver(progress, target, Date.now),
    now: Date.now,
    random: Math.random,
  });

  useSessionExit(
    () => view.session.value,
    () => `${String(progress.resets)}/${context().layout}`,
    leave,
  );

  return [view, actions];
}
