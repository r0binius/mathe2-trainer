import type { Grade } from '../scheduling/scheduler';

/** What was measured when a shortcut was tested. */
export type Recall = {
  readonly failed: boolean;
  readonly durationMs: number;
  /** How many keys the answer took on the layout, which decides whose times it compares with. */
  readonly keyCount: number;
};

/** A logged first try as grading reads it. Reviews logged before key counts have none. */
export type GradedTry = Omit<Recall, 'keyCount'> & { readonly keyCount?: number };

/** Below `easyWithinMs` a first try is easy, above `hardAfterMs` it's hard. */
export type GradeLimits = {
  readonly easyWithinMs: number;
  readonly hardAfterMs: number;
};

/**
 * The limits until there are enough of the learner's own tries: under 2 s reads the title and
 * presses from muscle memory, over 6 s had to be thought about, as in the old app.
 */
export const fixedLimits: GradeLimits = { easyWithinMs: 2000, hardAfterMs: 6000 };

/** A first try this much faster than the typical time is easy. */
export const easierThanTypical = 0.6;

/** A first try this much slower than the typical time is hard. */
export const harderThanTypical = 2;

/** How many tries with as many keys the typical time needs before it replaces the fixed limits. */
export const triesForTypical = 20;

/** How many of the most recent tries with as many keys the typical time reads. */
export const recentTries = 200;

/**
 * Grades a test from what was measured alone. The user never rates themselves: a mistake means
 * the shortcut was forgotten, and the time to the correct answer, measured against `limits`,
 * tells how fluent the recall was.
 * @see §9 of `docs/legacy-architecture.md` for the old app's grading, which never used `easy`
 */
export function gradeRecall({ failed, durationMs }: Recall, limits: GradeLimits): Grade {
  if (failed) {
    return 'again';
  }

  if (durationMs < limits.easyWithinMs) {
    return 'easy';
  }

  return durationMs > limits.hardAfterMs ? 'hard' : 'good';
}

/**
 * The limits for a shortcut of `keyCount` keys: relative to the learner's typical time for such
 * shortcuts once the log has {@link triesForTypical} of them, the {@link fixedLimits} until then.
 * @see §3 of `docs/specs/science-backed-training.md`
 */
export function gradeLimits(log: readonly GradedTry[], keyCount: number): GradeLimits {
  const typical = typicalTries(log, keyCount);

  if (typical.length < triesForTypical) {
    return fixedLimits;
  }

  const typicalMs = median(typical);

  return {
    easyWithinMs: easierThanTypical * typicalMs,
    hardAfterMs: harderThanTypical * typicalMs,
  };
}

/**
 * The durations of the most recent correct first tries of `keyCount` keys, whose median is the
 * learner's typical time for such shortcuts. The log is oldest first.
 */
function typicalTries(log: readonly GradedTry[], keyCount: number): readonly number[] {
  return log
    .filter((entry) => !entry.failed && entry.keyCount === keyCount)
    .slice(-recentTries)
    .map(({ durationMs }) => durationMs);
}

/** The middle of the durations, or halfway between the middle two. Needs at least one. */
function median(durations: readonly number[]): number {
  const sorted = durations.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle] ?? 0;

  return sorted.length % 2 === 1 ? upper : ((sorted[middle - 1] ?? upper) + upper) / 2;
}
