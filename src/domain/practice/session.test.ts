import { describe, expect, it } from 'vitest';

import type { Item } from '../content/types';
import { learnPool, learnStrategy } from './learn';
import { reviewPool, reviewStrategy } from './review';
import type { Session, SessionMsg } from './session';
import { startSession, updateSession } from './session';

const definition: Item = { kind: 'definition', id: 't/def/a', title: 'A', statement: 'a' };
const claim: Item = { kind: 'claim', id: 't/wf/b', statement: 'b', holds: false, reason: 'r' };
const roll = { roll: 0, at: 1000 };

function run<Pool>(
  strategy: Parameters<typeof updateSession<Pool>>[0],
  start: Session<Pool>,
  msgs: readonly SessionMsg[],
) {
  return msgs.reduce(
    ({ model, effects }, msg) => {
      const next = updateSession(strategy, model, msg);

      return { model: next.model, effects: [...effects, ...next.effects] };
    },
    { model: start, effects: [] as readonly unknown[] },
  );
}

describe('learning', () => {
  it('trains a new statement, then tests it until it is recalled twice', () => {
    const start = startSession(
      learnStrategy,
      learnPool([definition], { learned: [], trained: [] }),
      0,
    );

    expect(start).toMatchObject({ phase: 'asking', mode: 'training' });

    const { model, effects } = run(learnStrategy, start, [
      { type: 'continue', ...roll },
      { type: 'reveal' },
      { type: 'grade', grade: 'good', ...roll },
      { type: 'reveal' },
      { type: 'grade', grade: 'good', ...roll },
    ]);

    expect(model.phase).toBe('finished');
    expect(effects).toContainEqual({ type: 'tested', id: definition.id, grade: 'good', at: 1000 });
    expect(effects.at(-1)).toMatchObject({
      type: 'learningChanged',
      snapshot: { learned: [definition.id] },
    });
  });

  it('never shows a claim with its answer, and grades it by the verdict', () => {
    const start = startSession(learnStrategy, learnPool([claim], { learned: [], trained: [] }), 0);

    expect(start).toMatchObject({ phase: 'asking', mode: 'testing' });

    const wrong = updateSession(learnStrategy, start, { type: 'judge', holds: true, at: 5 });

    expect(wrong.model).toMatchObject({ phase: 'revealed', judgedCorrectly: false });
    expect(wrong.effects).toContainEqual({ type: 'tested', id: claim.id, grade: 'again', at: 5 });
  });

  it('ignores a grade before the answer is revealed', () => {
    const pool = learnPool([definition], { learned: [], trained: [definition.id] });
    const start = startSession(learnStrategy, pool, 0);

    expect(
      updateSession(learnStrategy, start, { type: 'grade', grade: 'good', ...roll }).model,
    ).toBe(start);
  });
});

describe('reviewing', () => {
  it('asks a forgotten item again until it is recalled', () => {
    const start = startSession(reviewStrategy, reviewPool([definition]), 0);
    const { model, effects } = run(reviewStrategy, start, [
      { type: 'reveal' },
      { type: 'grade', grade: 'again', ...roll },
      { type: 'reveal' },
      { type: 'grade', grade: 'easy', ...roll },
    ]);

    expect(model).toMatchObject({ phase: 'finished', pool: { done: 1 } });
    expect(effects).toHaveLength(2);
  });
});
