import { describe, expect, it, vi } from 'vitest';

import { ok } from '@/domain/shared/result';

import type { ProgressActions } from './progressSaver';
import { progressSaver } from './progressSaver';

const german = 'com.apple.keylayout.German';
const at = Date.UTC(2026, 8, 28, 10);

function actions(): ProgressActions {
  return {
    recordReview: vi.fn(() => Promise.resolve(ok(undefined))),
    saveLearning: vi.fn(() => Promise.resolve(ok(undefined))),
  };
}

describe('progressSaver', () => {
  it('records a test as a review on the layout, now, with the local UTC offset', async () => {
    const progress = actions();
    const save = progressSaver(progress, { appId: 'app', layout: german }, () => at);

    await save({ type: 'tested', id: 'app/Meta+k', failed: true, durationMs: 1200 });

    expect(progress.recordReview).toHaveBeenCalledWith({
      id: 'app/Meta+k',
      layout: german,
      at,
      utcOffsetMinutes: -new Date(at).getTimezoneOffset(),
      failed: true,
      durationMs: 1200,
    });
  });

  it("saves learning into the set's progress", async () => {
    const progress = actions();
    const snapshot = {
      shortcuts: ['app/Meta+k'],
      learned: ['app/Meta+k'],
      trained: [],
      complete: true,
    } as const;
    const save = progressSaver(
      progress,
      { appId: 'app', setId: 'basics', layout: german },
      () => at,
    );

    await save({ type: 'learningChanged', snapshot });

    expect(progress.saveLearning).toHaveBeenCalledWith(
      { appId: 'app', setId: 'basics', layout: german },
      snapshot,
      at,
    );
  });

  it('fails to save learning without a set, as in a review', async () => {
    const save = progressSaver(actions(), { appId: 'app', layout: german }, () => at);
    const snapshot = { shortcuts: [], learned: [], trained: [], complete: true } as const;

    await expect(save({ type: 'learningChanged', snapshot })).resolves.toMatchObject({
      kind: 'err',
    });
  });
});
