import { describe, expect, it } from 'vitest';

import type { LearnPool } from './learn';
import { learnPool, learnStrategy } from './learn';
import type { Attempt, PracticeItem } from './session';

function item(key: string): PracticeItem {
  return { id: `app/Meta+${key}`, keys: ['Meta', key] };
}

const [a, b, c, d] = [item('a'), item('b'), item('c'), item('d')];

/** Weights 90 + 50 + 10 = 150: rolls below 0.6 pick unseen, below 140/150 trained, the rest learned. */
const mixed: LearnPool = {
  entries: [
    { item: a, stage: 'unseen' },
    { item: b, stage: 'trained' },
    { item: c, stage: 'unseen' },
    { item: d, stage: 'learned' },
  ],
  tested: [],
};

function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return { item: a, mode: 'testing', failed: false, durationMs: 1000, ...overrides };
}

describe('learnPool', () => {
  it('starts the shortcuts learned in earlier sessions as learned, the rest as unseen', () => {
    expect(learnPool([a, b], [b.id, 'app/gone'])).toStrictEqual({
      entries: [
        { item: a, stage: 'unseen' },
        { item: b, stage: 'learned' },
      ],
      tested: [],
    });
  });
});

describe('learnStrategy.next', () => {
  const { next } = learnStrategy;

  it.each([
    [0, a],
    [0.3, c],
    [0.59, c],
    [0.6, b],
    [0.94, d],
    [0.999, d],
  ])('weighs unseen 90, trained 50 and learned 10: roll %f picks %o', (roll, expected) => {
    expect(next(mixed, { roll, previous: undefined })?.item).toBe(expected);
  });

  it('trains unseen shortcuts and tests the others', () => {
    expect(next(mixed, { roll: 0, previous: undefined })?.mode).toBe('training');
    expect(next(mixed, { roll: 0.6, previous: undefined })?.mode).toBe('testing');
    expect(next(mixed, { roll: 0.95, previous: undefined })?.mode).toBe('testing');
  });

  it('drops empty buckets from the weights', () => {
    const pool: LearnPool = {
      entries: [
        { item: a, stage: 'trained' },
        { item: b, stage: 'learned' },
      ],
      tested: [],
    };

    // 50 + 10 = 60: trained up to 50/60.
    expect(next(pool, { roll: 0.83, previous: undefined })?.item).toBe(a);
    expect(next(pool, { roll: 0.84, previous: undefined })?.item).toBe(b);
  });

  it('never repeats the shortcut just shown while another one is left', () => {
    // b is alone in its bucket, which the old app would still have picked.
    expect(next(mixed, { roll: 0.6, previous: b })?.item).not.toBe(b);
  });

  it('repeats the shortcut just shown when it is the last one to practice', () => {
    const pool: LearnPool = { entries: [{ item: a, stage: 'trained' }], tested: [] };

    expect(next(pool, { roll: 0, previous: a })?.item).toBe(a);
  });

  it('leaves skipped shortcuts out', () => {
    const pool: LearnPool = {
      entries: [
        { item: a, stage: 'skipped' },
        { item: b, stage: 'unseen' },
      ],
      tested: [],
    };

    expect(next(pool, { roll: 0, previous: undefined })?.item).toBe(b);
  });

  it('ends when every shortcut that is not skipped is learned', () => {
    const pool: LearnPool = {
      entries: [
        { item: a, stage: 'learned' },
        { item: b, stage: 'skipped' },
      ],
      tested: [],
    };

    expect(next(pool, { roll: 0, previous: undefined })).toBeUndefined();
  });

  it('ends when every shortcut is skipped', () => {
    const pool: LearnPool = { entries: [{ item: a, stage: 'skipped' }], tested: [] };

    expect(next(pool, { roll: 0, previous: undefined })).toBeUndefined();
  });
});

describe('learnStrategy.complete', () => {
  const { complete } = learnStrategy;
  const pool: LearnPool = { entries: [{ item: a, stage: 'unseen' }], tested: [] };

  it('makes a trained shortcut trained, without a review', () => {
    expect(complete(pool, attempt({ mode: 'training' }))).toStrictEqual({
      pool: { entries: [{ item: a, stage: 'trained' }], tested: [] },
      effects: [],
    });
  });

  it('makes a shortcut recalled without a mistake learned, and reports the test', () => {
    expect(complete(pool, attempt())).toStrictEqual({
      pool: { entries: [{ item: a, stage: 'learned' }], tested: [a.id] },
      effects: [{ type: 'tested', id: a.id, failed: false, durationMs: 1000 }],
    });
  });

  it('sends a shortcut tested with a mistake back to trained', () => {
    const learned: LearnPool = { entries: [{ item: a, stage: 'learned' }], tested: [] };

    expect(complete(learned, attempt({ failed: true })).pool.entries).toStrictEqual([
      { item: a, stage: 'trained' },
    ]);
  });

  it('reports only the first test of a shortcut in a session', () => {
    const first = complete(pool, attempt({ failed: true }));

    expect(complete(first.pool, attempt()).effects).toStrictEqual([]);
  });

  it('leaves the other shortcuts as they are', () => {
    const two: LearnPool = {
      entries: [
        { item: a, stage: 'unseen' },
        { item: b, stage: 'trained' },
      ],
      tested: [],
    };

    expect(complete(two, attempt({ mode: 'training' })).pool.entries[1]).toBe(two.entries[1]);
  });
});

describe('learnStrategy.skip', () => {
  it('marks the shortcut as skipped for this session, without effects', () => {
    const pool: LearnPool = { entries: [{ item: a, stage: 'trained' }], tested: [] };

    expect(learnStrategy.skip(pool, a)).toStrictEqual({
      pool: { entries: [{ item: a, stage: 'skipped' }], tested: [] },
      effects: [],
    });
  });
});
