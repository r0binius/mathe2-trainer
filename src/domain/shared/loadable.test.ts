import { describe, expect, it } from 'vitest';

import { allLoaded, loadableOf, mapLoadable } from './loadable';
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

describe('allLoaded', () => {
  const locked = { kind: 'database', message: 'database is locked' } as const;

  it('is loaded with every value once all are loaded', () => {
    expect(
      allLoaded({ a: { status: 'loaded', value: 1 }, b: { status: 'loaded', value: 'b' } }),
    ).toStrictEqual({ status: 'loaded', value: { a: 1, b: 'b' } });
  });

  it('is loading while any is still loading', () => {
    expect(
      allLoaded({ a: { status: 'loaded', value: 1 }, b: { status: 'loading' } }),
    ).toStrictEqual({ status: 'loading' });
  });

  it('fails with the first failure, even while others are loading', () => {
    expect(
      allLoaded({ a: { status: 'loading' }, b: { status: 'failed', error: locked } }),
    ).toStrictEqual({ status: 'failed', error: locked });
  });
});

describe('mapLoadable', () => {
  it('transforms a loaded value', () => {
    expect(mapLoadable({ status: 'loaded', value: 2 }, (n) => n * 10)).toStrictEqual({
      status: 'loaded',
      value: 20,
    });
  });

  it('keeps loading and failed as they are', () => {
    const locked = { kind: 'database', message: 'database is locked' } as const;

    expect(mapLoadable({ status: 'loading' }, String)).toStrictEqual({ status: 'loading' });
    expect(mapLoadable({ status: 'failed', error: locked }, String)).toStrictEqual({
      status: 'failed',
      error: locked,
    });
  });
});
