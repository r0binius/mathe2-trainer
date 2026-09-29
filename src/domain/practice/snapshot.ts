import type { ShortcutId } from '../shortcuts/shortcutId';

/**
 * What a learning session leaves behind for the next one (the Memento): which shortcuts of the set
 * are learned, and which are trained, so they come back as tests. Skipped ones start over, as in
 * the old app; trained ones did too, until the technical debt round after step 5.
 */
export type LearnSnapshot = {
  /**
   * The shortcuts the session covered. Saving replaces only their progress, so shortcuts it left
   * out, such as ones that can't be pressed on this layout, stay learned.
   */
  readonly shortcuts: readonly ShortcutId[];
  readonly learned: readonly ShortcutId[];
  /** Pressed right while their keys were shown, but not yet recalled without them. */
  readonly trained: readonly ShortcutId[];
  /**
   * Every shortcut the session covered is learned. A skipped shortcut that isn't learned keeps it
   * incomplete; a skipped learned one doesn't.
   */
  readonly complete: boolean;
};
