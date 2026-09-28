import { describe, expect, it } from 'vitest';

import type { LearnEntry, LearnPool, LearnStage } from './learn';
import { learnPool, learnStrategy, snapshotLearning } from './learn';
import type { Attempt, PracticeItem } from './session';

function item(key: string): PracticeItem {
  return { id: `app/Meta+${key}`, keys: ['Meta', key] };
}

const [a, b, c, d] = [item('a'), item('b'), item('c'), item('d')];

function entry(practiceItem: PracticeItem, stage: LearnStage, skipped = false): LearnEntry {
  return { item: practiceItem, stage, skipped };
}

function poolOf(...entries: readonly LearnEntry[]): LearnPool {
  return { entries, tested: [] };
}

/** Weights 90 + 50 + 10 = 150: rolls below 0.6 pick unseen, below 140/150 trained, the rest learned. */
const mixed = poolOf(
  entry(a, 'unseen'),
  entry(b, 'trained'),
  entry(c, 'unseen'),
  entry(d, 'learned'),
);

function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return { item: a, mode: 'testing', failed: false, durationMs: 1000, ...overrides };
}

describe('learnPool', () => {
  it('starts the shortcuts learned in earlier sessions as learned, the rest as unseen', () => {
    expect(learnPool([a, b], [b.id, 'app/gone'])).toStrictEqual(
      poolOf(entry(a, 'unseen'), entry(b, 'learned')),
    );
  });

  it('starts over when every shortcut was already learned: the set was completed', () => {
    expect(learnPool([a, b], [a.id, b.id])).toStrictEqual(
      poolOf(entry(a, 'unseen'), entry(b, 'unseen')),
    );
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
    const pool = poolOf(entry(a, 'trained'), entry(b, 'learned'));

    // 50 + 10 = 60: trained up to 50/60.
    expect(next(pool, { roll: 0.83, previous: undefined })?.item).toBe(a);
    expect(next(pool, { roll: 0.84, previous: undefined })?.item).toBe(b);
  });

  it('never repeats the shortcut just shown while another one is left', () => {
    // b is alone in its bucket, which the old app would still have picked.
    expect(next(mixed, { roll: 0.6, previous: b })?.item).not.toBe(b);
  });

  it('repeats the shortcut just shown when it is the last one to practice', () => {
    expect(next(poolOf(entry(a, 'trained')), { roll: 0, previous: a })?.item).toBe(a);
  });

  it('leaves skipped shortcuts out', () => {
    const pool = poolOf(entry(a, 'unseen', true), entry(b, 'unseen'));

    expect(next(pool, { roll: 0, previous: undefined })?.item).toBe(b);
  });

  it('ends when every shortcut that is not skipped is learned', () => {
    const pool = poolOf(entry(a, 'learned'), entry(b, 'trained', true));

    expect(next(pool, { roll: 0, previous: undefined })).toBeUndefined();
  });

  it('ends when every shortcut is skipped', () => {
    expect(
      next(poolOf(entry(a, 'unseen', true)), { roll: 0, previous: undefined }),
    ).toBeUndefined();
  });
});

describe('learnStrategy.complete', () => {
  const { complete } = learnStrategy;
  const pool = poolOf(entry(a, 'unseen'), entry(b, 'learned'));

  it('makes a trained shortcut trained, without a review', () => {
    expect(complete(pool, attempt({ mode: 'training' }))).toStrictEqual({
      pool: poolOf(entry(a, 'trained'), entry(b, 'learned')),
      effects: [],
    });
  });

  it('makes a shortcut recalled without a mistake learned, reporting the test and the progress', () => {
    expect(complete(pool, attempt())).toStrictEqual({
      pool: { entries: [entry(a, 'learned'), entry(b, 'learned')], tested: [a.id] },
      effects: [
        { type: 'tested', id: a.id, failed: false, durationMs: 1000 },
        { type: 'learnedChanged', snapshot: { learned: [a.id, b.id], complete: true } },
      ],
    });
  });

  it('sends a learned shortcut tested with a mistake back to trained, reporting the progress', () => {
    expect(complete(pool, attempt({ item: b, failed: true }))).toStrictEqual({
      pool: { entries: [entry(a, 'unseen'), entry(b, 'trained')], tested: [b.id] },
      effects: [
        { type: 'tested', id: b.id, failed: true, durationMs: 1000 },
        { type: 'learnedChanged', snapshot: { learned: [], complete: false } },
      ],
    });
  });

  it('reports only the first test of a shortcut in a session', () => {
    const first = complete(pool, attempt({ failed: true }));

    expect(complete(first.pool, attempt()).effects).not.toContainEqual(
      expect.objectContaining({ type: 'tested' }),
    );
  });

  it('reports no progress when a learned shortcut stays learned', () => {
    expect(complete(pool, attempt({ item: b })).effects).toStrictEqual([
      { type: 'tested', id: b.id, failed: false, durationMs: 1000 },
    ]);
  });

  it('leaves the other shortcuts as they are', () => {
    expect(complete(pool, attempt({ mode: 'training' })).pool.entries[1]).toBe(pool.entries[1]);
  });
});

describe('learnStrategy.skip', () => {
  it('marks the shortcut as skipped for this session, keeping its stage, without effects', () => {
    expect(learnStrategy.skip(poolOf(entry(a, 'learned')), a)).toStrictEqual({
      pool: poolOf(entry(a, 'learned', true)),
      effects: [],
    });
  });
});

describe('snapshotLearning', () => {
  it('lists the learned shortcuts, skipped ones included', () => {
    const pool = poolOf(entry(a, 'learned', true), entry(b, 'trained'), entry(c, 'learned'));

    expect(snapshotLearning(pool)).toStrictEqual({ learned: [a.id, c.id], complete: false });
  });

  it('is complete once every shortcut is learned and none was skipped', () => {
    expect(snapshotLearning(poolOf(entry(a, 'learned'), entry(b, 'learned')))).toStrictEqual({
      learned: [a.id, b.id],
      complete: true,
    });
  });

  it('is not complete while a shortcut was skipped, as in the old app', () => {
    expect(snapshotLearning(poolOf(entry(a, 'learned'), entry(b, 'learned', true))).complete).toBe(
      false,
    );
  });

  it('restores through learnPool', () => {
    const snapshot = snapshotLearning(mixed);

    expect(snapshotLearning(learnPool([a, b, c, d], snapshot.learned))).toStrictEqual(snapshot);
  });
});
