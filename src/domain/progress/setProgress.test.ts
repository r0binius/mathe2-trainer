import { describe, expect, it } from 'vitest';

import type { SetProgress } from './setProgress';
import { recordLearning } from './setProgress';

const at = Date.UTC(2026, 8, 28, 10);
const earlier = at - 1000;

describe('recordLearning', () => {
  it('starts a set’s progress from the first snapshot', () => {
    expect(
      recordLearning(
        undefined,
        { shortcuts: ['app/Meta+a'], learned: ['app/Meta+a'], complete: false },
        at,
      ),
    ).toStrictEqual({
      learned: ['app/Meta+a'],
      updatedAt: at,
    });
  });

  it('marks the set completed when the snapshot is complete', () => {
    expect(
      recordLearning(
        undefined,
        { shortcuts: ['app/Meta+a'], learned: ['app/Meta+a'], complete: true },
        at,
      ),
    ).toStrictEqual({
      learned: ['app/Meta+a'],
      completedAt: at,
      updatedAt: at,
    });
  });

  it('keeps a completed set completed while it is learned again from scratch', () => {
    const completed: SetProgress = {
      learned: ['app/Meta+a'],
      completedAt: earlier,
      updatedAt: earlier,
    };

    expect(
      recordLearning(completed, { shortcuts: ['app/Meta+a'], learned: [], complete: false }, at),
    ).toStrictEqual({
      learned: [],
      completedAt: earlier,
      updatedAt: at,
    });
  });

  it('moves the completion to the latest time the set was completed', () => {
    const completed: SetProgress = { learned: [], completedAt: earlier, updatedAt: earlier };

    expect(
      recordLearning(
        completed,
        { shortcuts: ['app/Meta+a'], learned: ['app/Meta+a'], complete: true },
        at,
      ).completedAt,
    ).toBe(at);
  });

  it('keeps learned shortcuts the session didn’t cover, such as ones impossible on this layout', () => {
    // Regression: the session's snapshot used to replace everything learned before.
    const progress: SetProgress = { learned: ['app/Meta+c'], updatedAt: earlier };

    expect(
      recordLearning(
        progress,
        { shortcuts: ['app/Meta+a', 'app/Meta+b'], learned: ['app/Meta+a'], complete: false },
        at,
      ).learned,
    ).toStrictEqual(['app/Meta+c', 'app/Meta+a']);
  });

  it('replaces what the session covered, forgetting shortcuts it demoted', () => {
    const progress: SetProgress = { learned: ['app/Meta+a', 'app/Meta+b'], updatedAt: earlier };

    expect(
      recordLearning(
        progress,
        { shortcuts: ['app/Meta+a', 'app/Meta+b'], learned: ['app/Meta+b'], complete: false },
        at,
      ).learned,
    ).toStrictEqual(['app/Meta+b']);
  });
});
