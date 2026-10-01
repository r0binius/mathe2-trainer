import { describe, expect, it } from 'vitest';

import { err, ok } from '../shared/result';
import { decodeReviewLog } from './reviewLog';

describe('decodeReviewLog', () => {
  it('decodes the log, as Rust sends it', () => {
    const log = [
      { at: 1000, utcOffsetMinutes: 120, grade: 'good' },
      { at: 2000, utcOffsetMinutes: -300, grade: 'again' },
    ];

    expect(decodeReviewLog(log)).toStrictEqual(ok(log));
  });

  it('rejects an entry with an unknown grade', () => {
    const log = [{ at: 1000, utcOffsetMinutes: 120, grade: 'perfect' }];

    expect(decodeReviewLog(log).kind).toBe('err');
  });

  it('rejects a fractional time', () => {
    const log = [{ at: 1000.5, utcOffsetMinutes: 120, grade: 'good' }];

    expect(decodeReviewLog(log)).toStrictEqual(err({ path: '[0].at', expected: 'an integer' }));
  });
});
