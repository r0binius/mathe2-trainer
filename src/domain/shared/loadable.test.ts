import { describe, expect, it } from 'vitest';

import { loadableOf } from './loadable';
import { err, ok } from './result';

describe('loadableOf', () => {
  it('turns a loaded value into the loaded state', () => {
    expect(loadableOf(ok(42))).toStrictEqual({ status: 'loaded', value: 42 });
  });

  it('turns a failure into the failed state', () => {
    const error = { kind: 'database', message: 'database is locked' } as const;

    expect(loadableOf(err(error))).toStrictEqual({ status: 'failed', error });
  });
});
