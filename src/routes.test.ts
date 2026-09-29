import { describe, expect, it } from 'vitest';

import { depthOf, toApp, toLearn, toLibrary, toReview, toSet } from './routes';

describe('depthOf', () => {
  it('counts how deep a screen lies below the library', () => {
    expect(depthOf({ name: 'library' })).toBe(0);
    expect(depthOf({ name: 'app' })).toBe(1);
    expect(depthOf({ name: 'set' })).toBe(2);
    expect(depthOf({ name: 'review' })).toBe(2);
    expect(depthOf({ name: 'learn' })).toBe(3);
  });

  it('counts an unknown or unnamed route as the library', () => {
    expect(depthOf({ name: 'options' })).toBe(0);
    expect(depthOf({ name: undefined })).toBe(0);
  });
});

describe('route locations', () => {
  it('names each screen with its IDs', () => {
    expect(toLibrary()).toStrictEqual({ name: 'library' });
    expect(toApp('notes')).toStrictEqual({ name: 'app', params: { appId: 'notes' } });
    expect(toReview('notes')).toStrictEqual({ name: 'review', params: { appId: 'notes' } });
    expect(toSet('notes', 'basics')).toStrictEqual({
      name: 'set',
      params: { appId: 'notes', setId: 'basics' },
    });
    expect(toLearn('notes', 'basics')).toStrictEqual({
      name: 'learn',
      params: { appId: 'notes', setId: 'basics' },
    });
  });
});
