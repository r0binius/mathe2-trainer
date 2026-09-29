import { describe, expect, it } from 'vitest';

import type { SetProgress } from './setProgress';
import { recordLearning } from './setProgress';

const at = Date.UTC(2026, 8, 28, 10);
const earlier = at - 1000;

describe('recordLearning', () => {
  it('keeps the trained shortcuts the session covered, and the trained ones it did not', () => {
    const before: SetProgress = { learned: [], trained: ['app/Meta+x'], updatedAt: earlier };
    const snapshot = {
      shortcuts: ['app/Meta+a', 'app/Meta+b'],
      learned: ['app/Meta+a'],
      trained: ['app/Meta+b'],
      complete: false,
    } as const;

    expect(recordLearning(before, snapshot, at)).toStrictEqual({
      learned: ['app/Meta+a'],
      trained: ['app/Meta+x', 'app/Meta+b'],
      updatedAt: at,
    });
  });

  it('forgets a covered shortcut as trained once it is learned', () => {
    const before: SetProgress = { learned: [], trained: ['app/Meta+a'], updatedAt: earlier };
    const snapshot = {
      shortcuts: ['app/Meta+a'],
      learned: ['app/Meta+a'],
      trained: [],
      complete: true,
    } as const;

    expect(recordLearning(before, snapshot, at)).toMatchObject({ trained: [] });
  });

  it('starts a set’s progress from the first snapshot', () => {
    expect(
      recordLearning(
        undefined,
        { shortcuts: ['app/Meta+a'], learned: ['app/Meta+a'], trained: [], complete: false },
        at,
      ),
    ).toStrictEqual({
      learned: ['app/Meta+a'],
      trained: [],
      updatedAt: at,
    });
  });

  it('marks the set completed when the snapshot is complete', () => {
    expect(
      recordLearning(
        undefined,
        { shortcuts: ['app/Meta+a'], learned: ['app/Meta+a'], trained: [], complete: true },
        at,
      ),
    ).toStrictEqual({
      learned: ['app/Meta+a'],
      trained: [],
      completedAt: at,
      updatedAt: at,
    });
  });

  it('keeps a completed set completed while it is learned again from scratch', () => {
    const completed: SetProgress = {
      learned: ['app/Meta+a'],
      trained: [],
      completedAt: earlier,
      updatedAt: earlier,
    };

    expect(
      recordLearning(
        completed,
        { shortcuts: ['app/Meta+a'], learned: [], trained: [], complete: false },
        at,
      ),
    ).toStrictEqual({
      learned: [],
      trained: [],
      completedAt: earlier,
      updatedAt: at,
    });
  });

  it('moves the completion to the latest time the set was completed', () => {
    const completed: SetProgress = {
      learned: [],
      trained: [],
      completedAt: earlier,
      updatedAt: earlier,
    };

    expect(
      recordLearning(
        completed,
        { shortcuts: ['app/Meta+a'], learned: ['app/Meta+a'], trained: [], complete: true },
        at,
      ).completedAt,
    ).toBe(at);
  });

  it('keeps learned shortcuts the session didn’t cover, such as ones impossible on this layout', () => {
    // Regression: the session's snapshot used to replace everything learned before.
    const progress: SetProgress = { learned: ['app/Meta+c'], trained: [], updatedAt: earlier };

    expect(
      recordLearning(
        progress,
        {
          shortcuts: ['app/Meta+a', 'app/Meta+b'],
          learned: ['app/Meta+a'],
          trained: [],
          complete: false,
        },
        at,
      ).learned,
    ).toStrictEqual(['app/Meta+c', 'app/Meta+a']);
  });

  it('replaces what the session covered, forgetting shortcuts it demoted', () => {
    const progress: SetProgress = {
      learned: ['app/Meta+a', 'app/Meta+b'],
      trained: [],
      updatedAt: earlier,
    };

    expect(
      recordLearning(
        progress,
        {
          shortcuts: ['app/Meta+a', 'app/Meta+b'],
          learned: ['app/Meta+b'],
          trained: [],
          complete: false,
        },
        at,
      ).learned,
    ).toStrictEqual(['app/Meta+b']);
  });
});
