import { describe, expect, it } from 'vitest';

import { easyWithinMs, gradeRecall, hardAfterMs } from './grading';

describe('gradeRecall', () => {
  it('grades a test with a mistake as again, however fast', () => {
    expect(gradeRecall({ failed: true, durationMs: 500 })).toBe('again');
  });

  it.each([
    [0, 'easy'],
    [1999, 'easy'],
    [2000, 'good'],
    [6000, 'good'],
    [6001, 'hard'],
  ] as const)('grades a first try after %i ms as %s', (durationMs, grade) => {
    expect(gradeRecall({ failed: false, durationMs })).toBe(grade);
  });

  it('keeps the old app’s 6 s limit for hard, and adds 2 s for easy', () => {
    expect([easyWithinMs, hardAfterMs]).toStrictEqual([2000, 6000]);
  });
});
