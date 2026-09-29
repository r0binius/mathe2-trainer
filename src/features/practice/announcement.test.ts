import { describe, expect, it } from 'vitest';

import type { PracticeItem } from '@/domain/practice/session';

import { announcementOf } from './announcement';

const item: PracticeItem = { id: 'app/Meta+k', keys: ['Meta', 'k'], title: 'k' };

const presenting = {
  phase: 'presenting',
  pool: undefined,
  item,
  presentation: 1,
  shownAt: 0,
  misses: 0,
} as const;

describe('announcementOf', () => {
  it('announces a shortcut to train with its keys', () => {
    expect(announcementOf({ ...presenting, mode: 'training' })).toStrictEqual({
      kind: 'train',
      item,
    });
  });

  it('announces a shortcut to recall without its keys', () => {
    expect(announcementOf({ ...presenting, mode: 'testing' })).toStrictEqual({
      kind: 'test',
      item,
    });
  });

  it('says a wrong answer while training, and the keys again', () => {
    expect(announcementOf({ ...presenting, mode: 'training', misses: 1 })).toStrictEqual({
      kind: 'miss',
      item,
    });
  });

  it('says a wrong answer while testing, and the right keys', () => {
    const session = {
      ...presenting,
      mode: 'testing',
      misses: 1,
      failure: { kind: 'wrong', keys: ['Meta', 'j'] },
    } as const;

    expect(announcementOf(session)).toStrictEqual({ kind: 'wrong', item });
  });

  it('says the right keys once a test is forgotten', () => {
    const session = { ...presenting, mode: 'testing', failure: { kind: 'forgot' } } as const;

    expect(announcementOf(session)).toStrictEqual({ kind: 'forgot', item });
  });

  it('says a correct answer', () => {
    expect(
      announcementOf({ phase: 'succeeded', pool: undefined, item, presentation: 1 }),
    ).toStrictEqual({ kind: 'correct', item });
  });

  it('announces nothing once the session is over', () => {
    expect(announcementOf({ phase: 'finished', pool: undefined })).toBeUndefined();
  });
});
