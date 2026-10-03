import type { Item } from '../content/types';
import type { PracticeStrategy } from './session';
import { failed, testedEffects } from './session';

/** The pool of a review session: the items still to recall, the next one first. */
export type ReviewPool = {
  readonly queue: readonly Item[];
  /** Items recalled or skipped so far. With the queue's length, it gives the progress. */
  readonly done: number;
};

/** Starts a review session with the due items, in the order they're due. */
export function reviewPool(due: readonly Item[]): ReviewPool {
  return { queue: due, done: 0 };
}

/**
 * Reviewing due items: each one is tested in queue order, and one that wasn't recalled goes to
 * the back of the queue until it is. Every attempt is reported.
 */
export const reviewStrategy: PracticeStrategy<ReviewPool> = {
  next: ({ queue }) => {
    const [first] = queue;

    return first && { item: first, mode: 'testing' };
  },
  complete: (pool, attempt) => {
    const rest = without(pool.queue, attempt.item);

    return {
      pool: failed(attempt)
        ? { ...pool, queue: [...rest, attempt.item] }
        : { queue: rest, done: pool.done + 1 },
      effects: testedEffects(attempt),
    };
  },
  skip: (pool, item) => ({
    pool: { queue: without(pool.queue, item), done: pool.done + 1 },
    effects: [],
  }),
};

function without(queue: readonly Item[], item: Item): readonly Item[] {
  return queue.filter(({ id }) => id !== item.id);
}
