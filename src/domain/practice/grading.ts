/** How well a shortcut was recalled, on the scale FSRS schedules with. */
export type Grade = 'again' | 'hard' | 'good' | 'easy';

/** What was measured when a shortcut was tested. */
export type Recall = {
  readonly failed: boolean;
  readonly durationMs: number;
};

/** A first try faster than this reads the title and presses from muscle memory. */
export const easyWithinMs = 2000;

/** A first try slower than this had to be thought about, as in the old app. */
export const hardAfterMs = 6000;

/**
 * Grades a test from what was measured alone. The user never rates themselves: a mistake means
 * the shortcut was forgotten, and the time to the correct answer tells how fluent the recall was.
 * @see §9 of `docs/legacy-architecture.md` for the old app's grading, which never used `easy`
 */
export function gradeRecall({ failed, durationMs }: Recall): Grade {
  if (failed) {
    return 'again';
  }

  if (durationMs < easyWithinMs) {
    return 'easy';
  }

  return durationMs > hardAfterMs ? 'hard' : 'good';
}
