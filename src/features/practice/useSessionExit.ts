import { watch } from 'vue';

import type { Session } from '@/domain/practice/session';

/**
 * Leaves a practice screen once its session is over: when it finishes (right away if there was
 * nothing to practice), or when what it started from changes, such as the progress being reset or
 * the layout switching. The session took a snapshot of both at its start, so going on would save
 * from stale data.
 */
export function useSessionExit<Pool>(
  session: () => Session<Pool>,
  origin: () => string,
  leave: () => void,
): void {
  watch(
    () => session().phase === 'finished',
    (finished) => {
      if (finished) {
        leave();
      }
    },
    { immediate: true },
  );

  watch(origin, leave);
}
