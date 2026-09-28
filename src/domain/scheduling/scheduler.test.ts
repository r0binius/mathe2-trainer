import { describe, expect, it } from 'vitest';

import { err, ok } from '../shared/result';
import { validMemory } from './memory.fixture';
import type { Card, CardMemory, CardMemoryFields, Grade, ReviewTime } from './scheduler';
import { dayMs, decodeCard, dueCards, parseCardMemory, reviewCard } from './scheduler';

const at = Date.UTC(2026, 8, 28, 10);
const german = 'com.apple.keylayout.German';

/** Schedules every grade two days out, so the rules around the scheduler show. */
function twoDays(
  memory: CardMemory | undefined,
  grade: Grade,
  { at: reviewedAt, utcOffsetMinutes }: ReviewTime,
): CardMemory {
  return validMemory({
    stability: grade === 'again' ? 0.5 : 2,
    // Shows which offset the scheduler got.
    difficulty: 5 + utcOffsetMinutes / 60,
    lastReviewAt: reviewedAt,
    dueAt: reviewedAt + 2 * dayMs,
    reps: (memory?.reps ?? 0) + 1,
    lapses: memory?.lapses ?? 0,
  });
}

const fields: CardMemoryFields = {
  stability: 2,
  difficulty: 5,
  lastReviewAt: at - 2 * dayMs,
  dueAt: at,
  reps: 1,
  lapses: 0,
};

const card: Card = { ...validMemory(fields), id: 'app/Meta+a', layout: german };

describe('parseCardMemory', () => {
  it('accepts memory in the ranges FSRS works with', () => {
    expect(parseCardMemory(fields)).toStrictEqual({ kind: 'ok', value: fields });
  });

  it.each([
    [{ stability: Number.NaN }, 'not-finite'],
    [{ dueAt: Number.POSITIVE_INFINITY }, 'not-finite'],
    [{ stability: 0 }, 'stability'],
    [{ stability: 36_501 }, 'stability'],
    [{ difficulty: 0.9 }, 'difficulty'],
    [{ difficulty: 10.1 }, 'difficulty'],
    [{ reps: 0 }, 'counts'],
    [{ reps: 1.5 }, 'counts'],
    [{ lapses: -1 }, 'counts'],
    [{ reps: 2, lapses: 2 }, 'counts'],
    [{ dueAt: at - 3 * dayMs }, 'dates'],
  ] as const)('rejects %o as %s', (change, reason) => {
    expect(parseCardMemory({ ...fields, ...change })).toStrictEqual(err({ reason }));
  });
});

describe('reviewCard', () => {
  it('creates a card on the first success', () => {
    expect(
      reviewCard(twoDays, undefined, {
        id: card.id,
        layout: german,
        grade: 'good',
        at,
        utcOffsetMinutes: 0,
      }),
    ).toStrictEqual({
      id: card.id,
      layout: german,
      stability: 2,
      difficulty: 5,
      lastReviewAt: at,
      dueAt: at + 2 * dayMs,
      reps: 1,
      lapses: 0,
    });
  });

  it('passes the review time and its UTC offset to the scheduler', () => {
    expect(
      reviewCard(twoDays, card, {
        id: card.id,
        layout: german,
        grade: 'good',
        at,
        utcOffsetMinutes: 120,
      })?.difficulty,
    ).toBe(7);
  });

  it('creates no card when the first test fails: that is still learning', () => {
    expect(
      reviewCard(twoDays, undefined, {
        id: card.id,
        layout: german,
        grade: 'again',
        at,
        utcOffsetMinutes: 0,
      }),
    ).toBeUndefined();
  });

  it('reschedules an existing card with the scheduler', () => {
    expect(
      reviewCard(twoDays, card, {
        id: card.id,
        layout: german,
        grade: 'hard',
        at,
        utcOffsetMinutes: 0,
      }),
    ).toMatchObject({
      reps: 2,
      dueAt: at + 2 * dayMs,
    });
  });

  it('makes a forgotten card due a day after its review, however stable it still is', () => {
    expect(
      reviewCard(twoDays, card, {
        id: card.id,
        layout: german,
        grade: 'again',
        at,
        utcOffsetMinutes: 0,
      })?.dueAt,
    ).toBe(at + dayMs);
  });
});

describe('dueCards', () => {
  const endOfToday = Date.UTC(2026, 8, 29);

  function dueAt(time: number): Card {
    return { ...card, id: `app/${String(time)}`, dueAt: time };
  }

  it('returns the cards due before the end of today, the longest overdue first', () => {
    const later = dueAt(endOfToday - 1);
    const earlier = dueAt(at - dayMs);

    expect(dueCards([later, dueAt(endOfToday), earlier], german, endOfToday)).toStrictEqual([
      earlier,
      later,
    ]);
  });

  it('leaves out the cards of other keyboard layouts, since progress is kept per layout', () => {
    const us = { ...dueAt(at), layout: 'com.apple.keylayout.US' };

    expect(dueCards([us, dueAt(at)], german, endOfToday)).toStrictEqual([dueAt(at)]);
  });
});

describe('decodeCard', () => {
  const stored = { ...fields, id: 'app/Meta+a', layout: german };

  it('decodes a stored card, as Rust sends it', () => {
    expect(decodeCard(stored)).toStrictEqual(ok(card));
  });

  it('rejects memory FSRS cannot work with, saying why', () => {
    expect(decodeCard({ ...stored, stability: 0 })).toStrictEqual(
      err({ path: '', expected: 'valid card memory (stability)' }),
    );
  });

  it('rejects a card with a field of the wrong type', () => {
    expect(decodeCard({ ...stored, reps: 1.5 })).toStrictEqual(
      err({ path: 'reps', expected: 'an integer' }),
    );
  });
});
