import type { PracticeItem, PracticeStrategy } from './session';
import { testedEffect } from './session';

/** The pool of a review session: the shortcuts still to recall, the next one first. */
export type ReviewPool = {
  readonly queue: readonly PracticeItem[];
  /** Shortcuts recalled or skipped so far. With the queue's length, it gives the progress. */
  readonly done: number;
};

/** Starts a review session with the due shortcuts, in the order they're due. */
export function reviewPool(due: readonly PracticeItem[]): ReviewPool {
  return { queue: due, done: 0 };
}

/**
 * Reviewing due shortcuts: each one is tested in queue order, and one tested with a mistake goes
 * to the back of the queue until it's recalled on the first try. Every attempt is reported.
 * @see §9 of `docs/legacy-architecture.md`
 */
export const reviewStrategy: PracticeStrategy<ReviewPool> = {
  next: ({ queue }) => {
    const [first] = queue;

    return first && { item: first, mode: 'testing' };
  },

  complete: (pool, attempt) => {
    const rest = without(pool.queue, attempt.item);

    return {
      pool: attempt.failed
        ? { ...pool, queue: [...rest, attempt.item] }
        : { queue: rest, done: pool.done + 1 },
      effects: [testedEffect(attempt)],
    };
  },

  skip: (pool, item) => ({
    pool: { queue: without(pool.queue, item), done: pool.done + 1 },
    effects: [],
  }),
};

function without(queue: readonly PracticeItem[], item: PracticeItem): readonly PracticeItem[] {
  return queue.filter(({ id }) => id !== item.id);
}
