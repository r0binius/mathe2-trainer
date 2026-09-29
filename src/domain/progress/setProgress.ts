import type { LearnSnapshot } from '../practice/snapshot';
import type { ShortcutId } from '../shortcuts/shortcutId';

/**
 * How far learning a set has come, one record per set and keyboard layout. It replaces the old
 * app's list of runs: the screens only ever needed the latest progress and whether the set was
 * completed.
 */
export type SetProgress = {
  readonly learned: readonly ShortcutId[];
  /** Trained, but not yet recalled; they come back as tests. */
  readonly trained: readonly ShortcutId[];
  /** When the set was last completed. Kept while it's learned again, so it still shows as done. */
  readonly completedAt?: number;
  readonly updatedAt: number;
};

/**
 * Saves a learning session's snapshot into the set's progress (the Memento's caretaker). It
 * replaces the progress of the shortcuts the session covered and keeps the rest, such as learned
 * shortcuts that can't be pressed on this layout today.
 */
export function recordLearning(
  progress: SetProgress | undefined,
  { shortcuts, learned: learnedNow, trained: trainedNow, complete }: LearnSnapshot,
  at: number,
): SetProgress {
  function uncovered(ids: readonly ShortcutId[] | undefined): readonly ShortcutId[] {
    return (ids ?? []).filter((id) => !shortcuts.includes(id));
  }

  const learned = [...uncovered(progress?.learned), ...learnedNow];
  const trained = [...uncovered(progress?.trained), ...trainedNow];
  const completedAt = complete ? at : progress?.completedAt;

  return completedAt === undefined
    ? { learned, trained, updatedAt: at }
    : { learned, trained, completedAt, updatedAt: at };
}
