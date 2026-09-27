import { describe, expect, it } from 'vitest';

import type {
  PracticeItem,
  PracticeStrategy,
  Presentation,
  ProgressEffect,
  Session,
  SessionMsg,
} from './session';
import { startSession, successPauseMs, updateSession } from './session';

const find: PracticeItem = { id: 'vscodium/Meta+f', keys: ['Meta', 'f'] };
const save: PracticeItem = { id: 'vscodium/Meta+s', keys: ['Meta', 's'] };

/** Presents a list in order, drawing with the roll, and reports what it's asked to do as effects. */
const inOrder: PracticeStrategy<readonly Presentation[]> = {
  next: (pool, { roll, previous }) => {
    const candidates = pool.filter(({ item }) => item.id !== previous?.id);
    return candidates[Math.floor(roll * candidates.length)];
  },
  complete: (pool, attempt) => ({
    pool: pool.filter(({ item }) => item.id !== attempt.item.id),
    effects: [
      {
        type: 'tested',
        id: attempt.item.id,
        failed: attempt.failed,
        durationMs: attempt.durationMs,
      },
    ],
  }),
  skip: (pool, item) => ({
    pool: pool.filter((presentation) => presentation.item.id !== item.id),
    effects: [],
  }),
};

const training: Presentation = { item: find, mode: 'training' };
const testing: Presentation = { item: find, mode: 'testing' };

function presenting(
  presentation: Presentation,
  pool: readonly Presentation[] = [presentation],
): Session<readonly Presentation[]> {
  return { phase: 'presenting', pool, ...presentation, shownAt: 1000, misses: 0 };
}

function succeeded(
  pool: readonly Presentation[],
  item: PracticeItem = find,
): Session<readonly Presentation[]> {
  return { phase: 'succeeded', pool, item };
}

describe('startSession', () => {
  it('presents what the strategy draws with the roll, shown at the given time', () => {
    const pool: readonly Presentation[] = [training, { item: save, mode: 'testing' }];

    expect(startSession(inOrder, pool, { roll: 0.9, at: 1000 })).toStrictEqual({
      phase: 'presenting',
      pool,
      item: save,
      mode: 'testing',
      shownAt: 1000,
      misses: 0,
    });
  });

  it('finishes at once when the strategy has nothing to present', () => {
    expect(startSession(inOrder, [], { roll: 0, at: 1000 })).toStrictEqual({
      phase: 'finished',
      pool: [],
    });
  });
});

describe('answering', () => {
  it('succeeds with the right keys in any order, completing the attempt with the strategy', () => {
    expect(
      updateSession(inOrder, presenting(training), {
        type: 'answer',
        keys: ['f', 'Meta'],
        at: 3500,
      }),
    ).toStrictEqual({
      model: succeeded([]),
      effects: [
        { type: 'tested', id: find.id, failed: false, durationMs: 2500 },
        { type: 'advanceAfter', ms: successPauseMs },
      ],
    });
  });

  it('shows a success for one second, as in the old app', () => {
    expect(successPauseMs).toBe(1000);
  });

  it('counts a miss in training, without remembering the keys', () => {
    expect(
      updateSession(inOrder, presenting(training), {
        type: 'answer',
        keys: ['Meta', 'g'],
        at: 2000,
      }),
    ).toStrictEqual({ model: { ...presenting(training), misses: 1 }, effects: [] });
  });

  it('rejects extra keys', () => {
    const { model } = updateSession(inOrder, presenting(training), {
      type: 'answer',
      keys: ['Shift', 'Meta', 'f'],
      at: 2000,
    });

    expect(model).toMatchObject({ phase: 'presenting', misses: 1 });
  });

  it('keeps the first wrong keys of a test as its mistake', () => {
    const first = updateSession(inOrder, presenting(testing), {
      type: 'answer',
      keys: ['Meta', 'g'],
      at: 2000,
    });
    const second = updateSession(inOrder, first.model, {
      type: 'answer',
      keys: ['Meta', 'h'],
      at: 3000,
    });

    expect(second).toStrictEqual({
      model: { ...presenting(testing), misses: 2, mistake: ['Meta', 'g'] },
      effects: [],
    });
  });

  it('completes a test as failed when it had a mistake', () => {
    const missed = updateSession(inOrder, presenting(testing), {
      type: 'answer',
      keys: ['Meta', 'g'],
      at: 2000,
    });

    expect(
      updateSession(inOrder, missed.model, { type: 'answer', keys: ['Meta', 'f'], at: 4000 })
        .effects,
    ).toContainEqual({ type: 'tested', id: find.id, failed: true, durationMs: 3000 });
  });

  it('ignores answers after a success, while the result is shown', () => {
    const session = succeeded([]);

    expect(
      updateSession(inOrder, session, { type: 'answer', keys: ['Meta', 'g'], at: 2000 }).model,
    ).toBe(session);
  });
});

describe('advancing', () => {
  it('presents the next draw, avoiding the item just shown, from the given time', () => {
    const next: Presentation = { item: save, mode: 'training' };
    const pool = [training, next];

    expect(
      updateSession(inOrder, succeeded(pool), { type: 'advance', roll: 0, at: 5000 }),
    ).toStrictEqual({ model: { ...presenting(next, pool), shownAt: 5000 }, effects: [] });
  });

  it('finishes when the strategy has nothing left to present', () => {
    expect(
      updateSession(inOrder, succeeded([]), { type: 'advance', roll: 0, at: 5000 }),
    ).toStrictEqual({ model: { phase: 'finished', pool: [] }, effects: [] });
  });

  it('is ignored while an item waits for its answer', () => {
    const session = presenting(training);

    expect(updateSession(inOrder, session, { type: 'advance', roll: 0, at: 5000 }).model).toBe(
      session,
    );
  });
});

describe('skipping', () => {
  it('skips with the strategy and presents the next draw', () => {
    const next: Presentation = { item: save, mode: 'testing' };

    expect(
      updateSession(inOrder, presenting(training, [training, next]), {
        type: 'skip',
        roll: 0,
        at: 5000,
      }),
    ).toStrictEqual({ model: { ...presenting(next, [next]), shownAt: 5000 }, effects: [] });
  });

  it('passes on what the strategy reports', () => {
    const reporting: PracticeStrategy<readonly Presentation[]> = {
      ...inOrder,
      skip: (pool) => ({
        pool,
        effects: [{ type: 'tested', id: 'x/y', failed: true, durationMs: 0 }],
      }),
    };

    expect(
      updateSession(reporting, presenting(training), { type: 'skip', roll: 0, at: 5000 }).effects,
    ).toStrictEqual<readonly ProgressEffect[]>([
      { type: 'tested', id: 'x/y', failed: true, durationMs: 0 },
    ]);
  });

  it('is ignored after a success', () => {
    const session = succeeded([training]);

    expect(updateSession(inOrder, session, { type: 'skip', roll: 0, at: 5000 }).model).toBe(
      session,
    );
  });
});

describe('a finished session', () => {
  it('ignores every message', () => {
    const session: Session<readonly Presentation[]> = { phase: 'finished', pool: [] };
    const msgs: readonly SessionMsg[] = [
      { type: 'answer', keys: ['Meta', 'f'], at: 0 },
      { type: 'advance', roll: 0, at: 0 },
      { type: 'skip', roll: 0, at: 0 },
    ];

    expect(msgs.map((msg) => updateSession(inOrder, session, msg).model)).toStrictEqual([
      session,
      session,
      session,
    ]);
  });
});
