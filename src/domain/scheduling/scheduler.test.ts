import { describe, expect, it } from 'vitest';

import { err } from '../shared/result';
import { validMemory } from './memory.fixture';
import type { Card, CardMemory, CardMemoryFields, Grade } from './scheduler';
import { dayMs, dueCards, parseCardMemory, reviewCard } from './scheduler';

const at = Date.UTC(2026, 8, 28, 10);

/** Schedules every grade two days out, so the rules around the scheduler show. */
function twoDays(memory: CardMemory | undefined, grade: Grade, reviewedAt: number): CardMemory {
  return validMemory({
    stability: grade === 'again' ? 0.5 : 2,
    difficulty: 5,
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

const card: Card = { ...validMemory(fields), id: 'app/Meta+a' };

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
    expect(reviewCard(twoDays, undefined, { id: card.id, grade: 'good', at })).toStrictEqual({
      id: card.id,
      stability: 2,
      difficulty: 5,
      lastReviewAt: at,
      dueAt: at + 2 * dayMs,
      reps: 1,
      lapses: 0,
    });
  });

  it('creates no card when the first test fails: that is still learning', () => {
    expect(reviewCard(twoDays, undefined, { id: card.id, grade: 'again', at })).toBeUndefined();
  });

  it('reschedules an existing card with the scheduler', () => {
    expect(reviewCard(twoDays, card, { id: card.id, grade: 'hard', at })).toMatchObject({
      reps: 2,
      dueAt: at + 2 * dayMs,
    });
  });

  it('makes a forgotten card due a day after its review, however stable it still is', () => {
    expect(reviewCard(twoDays, card, { id: card.id, grade: 'again', at })?.dueAt).toBe(at + dayMs);
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

    expect(dueCards([later, dueAt(endOfToday), earlier], endOfToday)).toStrictEqual([
      earlier,
      later,
    ]);
  });
});
