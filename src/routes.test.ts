import { describe, expect, it } from 'vitest';

import { toApp, toLearn, toOverview, toReview, toSet } from './routes';

describe('route locations', () => {
  it('names each screen with its IDs', () => {
    expect(toOverview()).toStrictEqual({ name: 'overview' });
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
