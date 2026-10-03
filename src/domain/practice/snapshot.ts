import type { ItemId } from '../content/types';

/**
 * What a learning session leaves behind for the next one (the Memento): which items it covered,
 * and how far each got. Items it covered that are neither learned nor trained are still unseen.
 */
export type LearnSnapshot = {
  readonly items: readonly ItemId[];
  readonly learned: readonly ItemId[];
  readonly trained: readonly ItemId[];
};
