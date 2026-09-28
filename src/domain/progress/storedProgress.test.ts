import { describe, expect, it } from 'vitest';

import { validMemory } from '../scheduling/memory.fixture';
import type { Card } from '../scheduling/scheduler';
import { err, ok } from '../shared/result';
import type { SetRecord } from './storedProgress';
import { decodeSetRecord, decodeStoredProgress } from './storedProgress';

const german = 'com.apple.keylayout.German';

const record: SetRecord = {
  appId: 'macos',
  setId: 'windows',
  layout: german,
  progress: { learned: ['macos/Meta+m'], completedAt: 900, updatedAt: 1000 },
};

const memory = { stability: 2, difficulty: 5, lastReviewAt: 0, dueAt: 1000, reps: 1, lapses: 0 };

const card: Card = { ...validMemory(memory), id: 'macos/Meta+m', layout: german };

describe('decodeSetRecord', () => {
  it('decodes a set record, as Rust sends it', () => {
    expect(decodeSetRecord(record)).toStrictEqual(ok(record));
  });

  it('leaves out a completion that never happened', () => {
    const { learned, updatedAt } = record.progress;
    const neverCompleted = { ...record, progress: { learned, updatedAt } };

    expect(decodeSetRecord(neverCompleted)).toStrictEqual(ok(neverCompleted));
  });

  it('rejects a learned shortcut that is no shortcut ID', () => {
    const progress = { ...record.progress, learned: ['macos'] };

    expect(decodeSetRecord({ ...record, progress })).toStrictEqual(
      err({ path: 'progress.learned[0]', expected: 'a shortcut ID' }),
    );
  });
});

describe('decodeStoredProgress', () => {
  it('decodes set records and cards', () => {
    expect(decodeStoredProgress({ sets: [record], cards: [card] })).toStrictEqual(
      ok({ progress: { sets: [record], cards: [card] }, skipped: [] }),
    );
  });

  it('skips items that no longer decode, keeps the rest and reports the skipped ones', () => {
    const broken = { ...card, id: 'macos/Meta+w', difficulty: 11 };

    expect(decodeStoredProgress({ sets: [{}, record], cards: [broken, card] })).toStrictEqual(
      ok({
        progress: { sets: [record], cards: [card] },
        skipped: [
          { path: 'sets[0].appId', expected: 'a string' },
          { path: 'cards[0]', expected: 'valid card memory (difficulty)' },
        ],
      }),
    );
  });

  it('rejects a response of the wrong shape as a whole', () => {
    expect(decodeStoredProgress({ sets: [] })).toStrictEqual(
      err({ path: 'cards', expected: 'an array' }),
    );
  });
});
