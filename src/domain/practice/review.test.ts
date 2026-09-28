import { describe, expect, it } from 'vitest';

import { attempt, item } from './practice.fixture';
import { reviewPool, reviewStrategy } from './review';

const [a, b, c] = [item('a'), item('b'), item('c')];

describe('reviewPool', () => {
  it('queues the due shortcuts in the order given, with none done yet', () => {
    expect(reviewPool([b, a])).toStrictEqual({ queue: [b, a], done: 0 });
  });
});

describe('reviewStrategy.next', () => {
  const { next } = reviewStrategy;

  it('tests the first shortcut in the queue, whatever the roll', () => {
    expect(next(reviewPool([a, b]), { roll: 0.99, previous: undefined })).toStrictEqual({
      item: a,
      mode: 'testing',
    });
  });

  it('ends when the queue is empty', () => {
    expect(next(reviewPool([]), { roll: 0, previous: undefined })).toBeUndefined();
  });
});

describe('reviewStrategy.complete', () => {
  const { complete } = reviewStrategy;

  it('counts a recalled shortcut as done, and reports the test', () => {
    expect(complete(reviewPool([a, b]), attempt())).toStrictEqual({
      pool: { queue: [b], done: 1 },
      effects: [{ type: 'tested', id: a.id, failed: false, durationMs: 1000 }],
    });
  });

  it('sends a shortcut tested with a mistake to the back of the queue, and reports the test', () => {
    expect(complete(reviewPool([a, b, c]), attempt({ failed: true }))).toStrictEqual({
      pool: { queue: [b, c, a], done: 0 },
      effects: [{ type: 'tested', id: a.id, failed: true, durationMs: 1000 }],
    });
  });

  it('reports every attempt at a requeued shortcut, until it is recalled', () => {
    const failed = complete(reviewPool([a]), attempt({ failed: true }));

    expect(complete(failed.pool, attempt())).toStrictEqual({
      pool: { queue: [], done: 1 },
      effects: [{ type: 'tested', id: a.id, failed: false, durationMs: 1000 }],
    });
  });
});

describe('reviewStrategy.skip', () => {
  it('counts a skipped shortcut as done, without a review', () => {
    expect(reviewStrategy.skip(reviewPool([a, b]), a)).toStrictEqual({
      pool: { queue: [b], done: 1 },
      effects: [],
    });
  });
});
