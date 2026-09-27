import { describe, expect, it } from 'vitest';

import { err, ok } from './result';

describe('ok', () => {
  it('wraps a value in the ok arm', () => {
    expect(ok(42)).toStrictEqual({ kind: 'ok', value: 42 });
  });
});

describe('err', () => {
  it('wraps an error in the err arm', () => {
    expect(err('unknownKey')).toStrictEqual({ kind: 'err', error: 'unknownKey' });
  });
});
