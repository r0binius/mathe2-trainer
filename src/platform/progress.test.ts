import { describe, expect, it, vi } from 'vitest';

import type { LoggedReview } from '@/domain/progress/repository';
import type { SetRecord, StoredProgress } from '@/domain/progress/storedProgress';
import { validMemory } from '@/domain/scheduling/memory.fixture';
import type { Card } from '@/domain/scheduling/scheduler';
import { ok } from '@/domain/shared/result';

import { progressRepository } from './progress';

const german = 'com.apple.keylayout.German';

const record: SetRecord = {
  appId: 'macos',
  setId: 'windows',
  layout: german,
  progress: { learned: ['macos/Meta+m'], updatedAt: 1000 },
};

const card: Card = {
  ...validMemory({ stability: 2, difficulty: 5, lastReviewAt: 0, dueAt: 1000, reps: 1, lapses: 0 }),
  id: 'macos/Meta+m',
  layout: german,
};

const review: LoggedReview = {
  id: 'macos/Meta+m',
  layout: german,
  grade: 'good',
  at: 1000,
  utcOffsetMinutes: 120,
  failed: false,
  durationMs: 3000,
};

const progress: StoredProgress = { sets: [record], cards: [card] };

function answering(response: unknown) {
  return vi.fn(() => Promise.resolve(response));
}

describe('progressRepository', () => {
  it('loads progress with load_progress', async () => {
    const invoke = answering(progress);

    await expect(progressRepository(invoke).load()).resolves.toStrictEqual(
      ok({ progress, skipped: [] }),
    );
    expect(invoke).toHaveBeenCalledWith('load_progress', undefined);
  });

  it('saves a set record with save_set_progress', async () => {
    const invoke = answering(null);

    await expect(progressRepository(invoke).saveSet(record)).resolves.toStrictEqual(ok(undefined));
    expect(invoke).toHaveBeenCalledWith('save_set_progress', { record });
  });

  it('records a review and its card with record_review', async () => {
    const invoke = answering(null);

    await progressRepository(invoke).recordReview(review, card);
    expect(invoke).toHaveBeenCalledWith('record_review', { review, card });
  });

  it('sends no card for a failed first test as null', async () => {
    const invoke = answering(null);

    await progressRepository(invoke).recordReview({ ...review, grade: 'again' }, undefined);
    expect(invoke).toHaveBeenCalledWith('record_review', {
      review: { ...review, grade: 'again' },
      card: null,
    });
  });

  it('replaces progress with replace_progress and resets it with reset_progress', async () => {
    const invoke = answering(null);

    await progressRepository(invoke).replace(progress);
    await progressRepository(invoke).reset();
    expect(invoke).toHaveBeenNthCalledWith(1, 'replace_progress', { progress });
    expect(invoke).toHaveBeenNthCalledWith(2, 'reset_progress', undefined);
  });
});
