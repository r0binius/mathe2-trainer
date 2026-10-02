import { describe, expect, it } from 'vitest';

import type { GradedTry } from './grading';
import {
  easierThanTypical,
  fixedLimits,
  gradeLimits,
  gradeRecall,
  harderThanTypical,
  recentTries,
  triesForTypical,
} from './grading';

/** `count` correct first tries of two keys, each `durationMs`. */
function same(count: number, durationMs: number): readonly GradedTry[] {
  return Array.from({ length: count }, () => ({ failed: false, durationMs, keyCount: 2 }));
}

describe('gradeRecall', () => {
  it('grades a test with a mistake as again, however fast', () => {
    expect(gradeRecall({ failed: true, durationMs: 500, keyCount: 2 }, fixedLimits)).toBe('again');
  });

  it.each([
    [0, 'easy'],
    [1999, 'easy'],
    [2000, 'good'],
    [6000, 'good'],
    [6001, 'hard'],
  ] as const)('grades a first try after %i ms as %s with the fixed limits', (durationMs, grade) => {
    expect(gradeRecall({ failed: false, durationMs, keyCount: 2 }, fixedLimits)).toBe(grade);
  });

  it('keeps the old app’s 6 s limit for hard, and adds 2 s for easy', () => {
    expect(fixedLimits).toStrictEqual({ easyWithinMs: 2000, hardAfterMs: 6000 });
  });
});

describe('gradeLimits', () => {
  it('keeps the fixed limits until there are enough tries with as many keys', () => {
    expect(gradeLimits(same(triesForTypical - 1, 3000), 2)).toBe(fixedLimits);
  });

  it('then grades relative to the typical time: easy below 0.6 ×, hard above 2 ×', () => {
    expect(gradeLimits(same(triesForTypical, 3000), 2)).toStrictEqual({
      easyWithinMs: 1800,
      hardAfterMs: 6000,
    });
  });

  it('compares a shortcut only with shortcuts of as many keys', () => {
    expect(gradeLimits(same(triesForTypical, 3000), 3)).toBe(fixedLimits);
  });

  it('takes the typical time as the median, halfway between the middle two for an even count', () => {
    const odd = [...same(10, 1000), ...same(11, 3000)];
    const even = [...same(10, 1000), ...same(10, 3000)];

    expect(gradeLimits(odd, 2).easyWithinMs).toBe(1800);
    expect(gradeLimits(even, 2).easyWithinMs).toBe(1200);
  });

  it('reads only the most recent tries, the log being oldest first', () => {
    const log = [...same(recentTries, 9000), ...same(recentTries, 1000)];

    expect(gradeLimits(log, 2).hardAfterMs).toBe(2000);
  });

  it('counts only correct tries, and none logged before key counts were stored', () => {
    const log = [
      ...same(triesForTypical - 1, 3000),
      { failed: true, durationMs: 3000, keyCount: 2 },
      { failed: false, durationMs: 3000 },
    ];

    expect(gradeLimits(log, 2)).toBe(fixedLimits);
  });

  it('uses the factors of the spec, and the numbers of tries', () => {
    expect([easierThanTypical, harderThanTypical, triesForTypical, recentTries]).toStrictEqual([
      0.6, 2, 20, 200,
    ]);
  });
});
