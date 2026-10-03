import { describe, expect, it } from 'vitest';

import { topics } from '@/data/topics';
import { renderRich } from '@/domain/content/rich';
import { composeExam, examPlans, scoreExam } from '@/domain/exam/exam';
import { decodeProgress, noProgress, recordLearning, recordTest } from '@/domain/progress/progress';
import { dueItems, streakOf } from '@/domain/progress/summary';
import { scheduleWithFsrs } from '@/domain/scheduling/fsrs';
import { dayMs } from '@/domain/scheduling/scheduler';

const at = Date.UTC(2026, 9, 3, 10);
const time = { at, utcOffsetMinutes: 120 };

describe('progress', () => {
  it('creates a card once an item is recalled, due again on a later day', () => {
    const failed = recordTest(scheduleWithFsrs, noProgress, { id: 'a', grade: 'again', ...time });

    expect(failed.cards).toHaveLength(0);
    expect(failed.log).toHaveLength(1);

    const recalled = recordTest(scheduleWithFsrs, failed, { id: 'a', grade: 'good', ...time });

    expect(recalled.cards).toHaveLength(1);
    expect(recalled.cards[0]?.dueAt).toBeGreaterThanOrEqual(at + dayMs / 2);
  });

  it('survives being stored as JSON', () => {
    const progress = recordLearning(
      recordTest(scheduleWithFsrs, noProgress, { id: 'a', grade: 'good', ...time }),
      { items: ['a', 'b'], learned: ['a'], trained: ['b'] },
      at,
    );

    expect(decodeProgress(JSON.parse(JSON.stringify(progress)))).toEqual({
      kind: 'ok',
      value: progress,
    });
  });

  it('counts a streak and finds what is due', () => {
    const item = topics[0]?.decks[0]?.items[0];
    const progress = recordTest(scheduleWithFsrs, noProgress, {
      id: item?.id ?? '',
      grade: 'good',
      ...time,
    });

    expect(streakOf(progress.log, time)).toBe(1);
    expect(dueItems(item ? [item] : [], progress, at + 400 * dayMs)).toHaveLength(1);
  });
});

describe('a mock exam', () => {
  it('is the same for the same seed and scores claims by their verdict', () => {
    const plan = examPlans[0];

    if (plan === undefined) {
      expect.unreachable();
    }

    const tasks = composeExam(topics, plan, 42);

    expect(tasks).toEqual(composeExam(topics, plan, 42));
    expect(tasks).toHaveLength(10);

    const verdicts = Object.fromEntries(
      tasks.flatMap(({ item }) => (item.kind === 'claim' ? [[item.id, item.holds]] : [])),
    );

    expect(scoreExam(tasks, { verdicts, awarded: {} }).points).toBe(5);
  });
});

describe('rich text', () => {
  it('escapes markup and keeps list items together', () => {
    const html = renderRich('<b> **x**\n\n- one $a$\ncontinued\n- two', (tex) => `[${tex}]`);

    expect(html).toBe(
      '<p>&lt;b&gt; <strong>x</strong></p><ul><li>one [a] continued</li><li>two</li></ul>',
    );
  });
});
