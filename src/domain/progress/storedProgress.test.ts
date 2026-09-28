import { describe, expect, it } from 'vitest';

import { validMemory } from '../scheduling/memory.fixture';
import type { Card } from '../scheduling/scheduler';
import { err, ok } from '../shared/result';
import type { SetRecord } from './storedProgress';
import {
  cardOf,
  decodeSetRecord,
  decodeStoredProgress,
  setProgressOf,
  withCard,
  withSetRecord,
} from './storedProgress';

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

describe('setProgressOf and withSetRecord', () => {
  const stored = { sets: [record], cards: [] };
  const us = { ...record, layout: 'com.apple.keylayout.US' };

  it('find a set record by app, set and layout', () => {
    expect(setProgressOf(stored, record)).toBe(record.progress);
    expect(setProgressOf(stored, us)).toBeUndefined();
  });

  it('replace the record of the same set and layout, or add a new one', () => {
    const relearned = { ...record, progress: { learned: [], updatedAt: 2000 } };

    expect(withSetRecord(stored, relearned)).toStrictEqual({ sets: [relearned], cards: [] });
    expect(withSetRecord(stored, us)).toStrictEqual({ sets: [record, us], cards: [] });
  });
});

describe('cardOf and withCard', () => {
  const stored = { sets: [], cards: [card] };
  const us = { ...card, layout: 'com.apple.keylayout.US' };

  it('find a card by shortcut and layout', () => {
    expect(cardOf(stored, card)).toBe(card);
    expect(cardOf(stored, us)).toBeUndefined();
  });

  it('replace the card of the same shortcut and layout, or add a new one', () => {
    const reviewed = { ...card, reps: 2 };

    expect(withCard(stored, reviewed)).toStrictEqual({ sets: [], cards: [reviewed] });
    expect(withCard(stored, us)).toStrictEqual({ sets: [], cards: [card, us] });
  });
});
