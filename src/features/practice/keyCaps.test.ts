import { describe, expect, it } from 'vitest';

import type { PracticeItem, Session } from '@/domain/practice/session';

import { keyCapsOf } from './keyCaps';

const item: PracticeItem = { id: 'app/Meta+k', keys: ['Meta', 'k'], title: 'k' };

const presenting = {
  phase: 'presenting',
  pool: undefined,
  item,
  presentation: 1,
  shownAt: 0,
  misses: 0,
} as const;

function shown(session: Exclude<Session<undefined>, { readonly phase: 'finished' }>) {
  return session;
}

describe('keyCapsOf', () => {
  it('shows the keys while training, pressed as they are held', () => {
    expect(keyCapsOf(shown({ ...presenting, mode: 'training' }), ['Meta'])).toStrictEqual([
      [
        { key: 'Meta', hidden: false, pressed: true },
        { key: 'k', hidden: false, pressed: false },
      ],
    ]);
  });

  it('hides the keys while testing, whatever is held', () => {
    expect(keyCapsOf(shown({ ...presenting, mode: 'testing' }), ['Meta'])).toStrictEqual([
      [
        { key: 'Meta', hidden: true, pressed: false },
        { key: 'k', hidden: true, pressed: false },
      ],
    ]);
  });

  it('after a wrong test, shows what was pressed, marked, above the right keys', () => {
    const session = shown({
      ...presenting,
      mode: 'testing',
      misses: 1,
      failure: { kind: 'wrong', keys: ['Meta', 'j'] },
    });

    expect(keyCapsOf(session, [])).toStrictEqual([
      [
        { key: 'Meta', hidden: false, pressed: true, result: 'correct' },
        { key: 'j', hidden: false, pressed: true, result: 'wrong' },
      ],
      [
        { key: 'Meta', hidden: false, pressed: false },
        { key: 'k', hidden: false, pressed: false },
      ],
    ]);
  });

  it('shows the right keys once a test is forgotten', () => {
    const session = shown({ ...presenting, mode: 'testing', failure: { kind: 'forgot' } });

    expect(keyCapsOf(session, ['Meta'])).toStrictEqual([
      [
        { key: 'Meta', hidden: false, pressed: true },
        { key: 'k', hidden: false, pressed: false },
      ],
    ]);
  });

  it('shows the keys pressed and correct once answered', () => {
    const session = shown({ phase: 'succeeded', pool: undefined, item, presentation: 1 });

    expect(keyCapsOf(session, [])).toStrictEqual([
      [
        { key: 'Meta', hidden: false, pressed: true, result: 'correct' },
        { key: 'k', hidden: false, pressed: true, result: 'correct' },
      ],
    ]);
  });
});
