import { describe, expect, it } from 'vitest';

import {
  andThen,
  array,
  at,
  boolean,
  integer,
  literal,
  map,
  number,
  object,
  oneOf,
  optional,
  partialRecord,
  sift,
  string,
} from './decode';
import { err, ok } from './result';

describe('primitives', () => {
  it('accept a value of their type', () => {
    expect(string('a')).toStrictEqual(ok('a'));
    expect(boolean(false)).toStrictEqual(ok(false));
    expect(number(3.17)).toStrictEqual(ok(3.17));
    expect(integer(-2)).toStrictEqual(ok(-2));
  });

  it('reject anything else, saying what they expected', () => {
    expect(string(1)).toStrictEqual(err({ path: '', expected: 'a string' }));
    expect(boolean('true')).toStrictEqual(err({ path: '', expected: 'a boolean' }));
    expect(number(Number.NaN)).toStrictEqual(err({ path: '', expected: 'a finite number' }));
    expect(integer(1.5)).toStrictEqual(err({ path: '', expected: 'an integer' }));
  });
});

describe('literal', () => {
  it('accepts only the given value', () => {
    expect(literal('holdCommand')('holdCommand')).toStrictEqual(ok('holdCommand'));
    expect(literal('holdCommand')('shortcut')).toStrictEqual(
      err({ path: '', expected: '"holdCommand"' }),
    );
  });
});

describe('array', () => {
  it('decodes every item', () => {
    expect(array(integer)([1, 2])).toStrictEqual(ok([1, 2]));
  });

  it('names the index of the first item that fails', () => {
    expect(array(integer)([1, 'x'])).toStrictEqual(err({ path: '[1]', expected: 'an integer' }));
    expect(array(integer)({})).toStrictEqual(err({ path: '', expected: 'an array' }));
  });
});

describe('object', () => {
  const point = object({ x: integer, label: optional(string) });

  it('decodes each field, and returns only the fields it knows', () => {
    expect(point({ x: 1, label: 'a', extra: true })).toStrictEqual(ok({ x: 1, label: 'a' }));
  });

  it('leaves out an optional field that is missing', () => {
    expect(point({ x: 1 })).toStrictEqual(ok({ x: 1 }));
  });

  it('names the path to the field that fails', () => {
    expect(point({ label: 'a' })).toStrictEqual(err({ path: 'x', expected: 'an integer' }));
    expect(point({ x: 1, label: null })).toStrictEqual(
      err({ path: 'label', expected: 'a string' }),
    );
    expect(object({ points: array(point) })({ points: [{ x: 'no' }] })).toStrictEqual(
      err({ path: 'points[0].x', expected: 'an integer' }),
    );
  });

  it('rejects what is no object', () => {
    expect(point([1])).toStrictEqual(err({ path: '', expected: 'an object' }));
    expect(point(null)).toStrictEqual(err({ path: '', expected: 'an object' }));
  });
});

describe('partialRecord', () => {
  const counts = partialRecord(['a', 'b'], integer);

  it('decodes the given keys that are there, and leaves out any other', () => {
    expect(counts({ a: 1, c: 3 })).toStrictEqual(ok({ a: 1 }));
  });

  it('names the key that fails', () => {
    expect(counts({ b: 'two' })).toStrictEqual(err({ path: 'b', expected: 'an integer' }));
  });
});

describe('oneOf', () => {
  const trigger = oneOf([
    object({ kind: literal('holdCommand') }),
    object({ kind: literal('shortcut'), keys: array(string) }),
  ]);

  it('decodes with the first decoder that succeeds', () => {
    expect(trigger({ kind: 'shortcut', keys: ['Meta'] })).toStrictEqual(
      ok({ kind: 'shortcut', keys: ['Meta'] }),
    );
  });

  it('reports the first failure when none got further than the input itself', () => {
    expect(trigger('holdCommand')).toStrictEqual(err({ path: '', expected: 'an object' }));
  });

  it('reports the failure that got furthest', () => {
    expect(trigger({ kind: 'shortcut', keys: [1] })).toStrictEqual(
      err({ path: 'keys[0]', expected: 'a string' }),
    );
  });
});

describe('map and andThen', () => {
  it('transform a decoded value', () => {
    expect(map(integer, (value) => value * 2)(3)).toStrictEqual(ok(6));
  });

  it('check a decoded value further', () => {
    const positive = andThen(integer, (value) =>
      value > 0 ? ok(value) : err({ path: '', expected: 'a positive integer' }),
    );

    expect(positive(3)).toStrictEqual(ok(3));
    expect(positive(-3)).toStrictEqual(err({ path: '', expected: 'a positive integer' }));
    expect(positive('3')).toStrictEqual(err({ path: '', expected: 'an integer' }));
  });
});

describe('sift', () => {
  it('keeps the items that decode and reports the others by index', () => {
    expect(sift(integer)([1, 'x', 3])).toStrictEqual(
      ok({ valid: [1, 3], invalid: [{ path: '[1]', expected: 'an integer' }] }),
    );
  });

  it('still rejects what is no array', () => {
    expect(sift(integer)('x')).toStrictEqual(err({ path: '', expected: 'an array' }));
  });
});

describe('at', () => {
  it('puts a field or an index in front of an error path', () => {
    expect(at('cards', { path: '[1].reps', expected: 'an integer' })).toStrictEqual({
      path: 'cards[1].reps',
      expected: 'an integer',
    });
    expect(at('[2]', { path: 'x', expected: 'an integer' })).toStrictEqual({
      path: '[2].x',
      expected: 'an integer',
    });
    expect(at('x', { path: '', expected: 'an integer' })).toStrictEqual({
      path: 'x',
      expected: 'an integer',
    });
  });
});
