import { describe, expect, it } from 'vitest';

import { err, ok } from '../shared/result';
import { decodeReviewLog } from './reviewLog';

describe('decodeReviewLog', () => {
  const good = { at: 1000, utcOffsetMinutes: 120, grade: 'good', failed: false, durationMs: 3000 };

  it('decodes the log, as Rust sends it', () => {
    const log = [
      { ...good, keyCount: 2 },
      {
        at: 2000,
        utcOffsetMinutes: -300,
        grade: 'again',
        failed: true,
        durationMs: 800,
        keyCount: 3,
      },
    ];

    expect(decodeReviewLog(log)).toStrictEqual(ok(log));
  });

  it('decodes a review logged before key counts were stored, without one', () => {
    expect(decodeReviewLog([good])).toStrictEqual(ok([good]));
  });

  it('rejects an entry with an unknown grade', () => {
    expect(decodeReviewLog([{ ...good, grade: 'perfect' }]).kind).toBe('err');
  });

  it('rejects a fractional time', () => {
    expect(decodeReviewLog([{ ...good, at: 1000.5 }])).toStrictEqual(
      err({ path: '[0].at', expected: 'an integer' }),
    );
  });

  it('rejects an entry without what it was graded from', () => {
    const withoutDuration = { at: 1000, utcOffsetMinutes: 120, grade: 'good', failed: false };

    expect(decodeReviewLog([withoutDuration]).kind).toBe('err');
  });
});
