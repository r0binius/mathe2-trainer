import type { ShortcutId } from '../shortcuts/shortcutId';

/**
 * What a learning session leaves behind for the next one (the Memento): which shortcuts of the set
 * are learned. Trained and skipped ones start over, as in the old app.
 */
export type LearnSnapshot = {
  readonly learned: readonly ShortcutId[];
  /** Every shortcut of the set is learned, and none was skipped on the way. */
  readonly complete: boolean;
};
