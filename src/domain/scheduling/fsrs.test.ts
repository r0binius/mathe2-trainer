import { describe, expect, it } from 'vitest';

import { maximumIntervalDays, scheduleWithFsrs } from './fsrs';
import { validMemory } from './memory.fixture';
import type { CardMemory, Grade, Scheduler } from './scheduler';
import { dayMs, parseCardMemory } from './scheduler';

const at = Date.UTC(2026, 8, 28, 10);
const hourMs = 60 * 60 * 1000;

// Typed as the port, so this also checks that the adapter fits it.
const port: Scheduler = scheduleWithFsrs;

/** Schedules a review in UTC, where local days are UTC days. */
function schedule(memory: CardMemory | undefined, grade: Grade, reviewedAt: number): CardMemory {
  return port(memory, grade, { at: reviewedAt, utcOffsetMinutes: 0 });
}

function daysUntilDue({ dueAt, lastReviewAt }: CardMemory): number {
  return (dueAt - lastReviewAt) / dayMs;
}

describe('scheduleWithFsrs', () => {
  // Reference values from FSRS-6's formulas with its default weights w:
  // initial stability S₀(G) = w[G−1], initial difficulty D₀(G) = w₄ − e^(w₅·(G−1)) + 1.
  it('starts a card recalled well with the initial memory for good', () => {
    const memory = schedule(undefined, 'good', at);

    expect(memory.stability).toBeCloseTo(2.3065, 4);
    expect(memory.difficulty).toBeCloseTo(2.1181, 4);
    expect(memory).toMatchObject({ lastReviewAt: at, reps: 1, lapses: 0 });
  });

  it('starts a card recalled fluently with the initial memory for easy', () => {
    const memory = schedule(undefined, 'easy', at);

    expect(memory.stability).toBeCloseTo(8.2956, 4);
    expect(memory.difficulty).toBe(1);
  });

  it('keeps the intervals of the grades apart, again < hard < good < easy', () => {
    const days = (['again', 'hard', 'good', 'easy'] as const).map((grade) =>
      daysUntilDue(schedule(undefined, grade, at)),
    );

    expect(days).toStrictEqual(days.toSorted((a, b) => a - b));
    expect(new Set(days).size).toBe(4);
  });

  it('grows the interval when a due card is recalled', () => {
    const first = schedule(undefined, 'good', at);
    const second = schedule(first, 'good', first.dueAt);

    expect(second.stability).toBeGreaterThan(first.stability);
    expect(daysUntilDue(second)).toBeGreaterThan(daysUntilDue(first));
    expect(second.reps).toBe(2);
  });

  it('counts a lapse and lowers the stability when a card is forgotten', () => {
    const first = schedule(undefined, 'good', at);
    const forgotten = schedule(first, 'again', first.dueAt);

    expect(forgotten.stability).toBeLessThan(first.stability);
    expect(forgotten.lapses).toBe(1);
  });

  it('barely changes the memory when a card is recalled again on the same day', () => {
    const first = schedule(undefined, 'good', at);

    expect(schedule(first, 'good', at + 60_000).stability).toBeCloseTo(first.stability, 4);
  });

  it('never schedules further out than a year', () => {
    const stable = validMemory({
      stability: 10_000,
      difficulty: 1,
      lastReviewAt: at - 365 * dayMs,
      dueAt: at,
      reps: 10,
      lapses: 0,
    });

    expect(maximumIntervalDays).toBe(365);
    expect(daysUntilDue(schedule(stable, 'easy', at))).toBeLessThanOrEqual(365);
  });

  it('fuzzes deterministically: the same review gives the same due date', () => {
    const first = schedule(undefined, 'easy', at);

    expect(schedule(first, 'good', first.dueAt)).toStrictEqual(
      schedule(first, 'good', first.dueAt),
    );
  });

  it('schedules a review timed before the last one as if at the last one, instead of failing', () => {
    const first = schedule(undefined, 'good', at);
    const skewed = schedule(first, 'good', at - 3 * dayMs);

    expect(skewed.lastReviewAt).toBe(at);
    expect(skewed.stability).toBeCloseTo(first.stability, 4);
  });

  it('returns valid memory for any valid memory, grade and review time', () => {
    const grades: readonly Grade[] = ['again', 'hard', 'good', 'easy'];
    const memories = [0.001, 0.5, 2, 100, 36_500].flatMap((stability) =>
      [1, 5.5, 10].map((difficulty) =>
        validMemory({
          stability,
          difficulty,
          lastReviewAt: at,
          dueAt: at + dayMs,
          reps: 3,
          lapses: 1,
        }),
      ),
    );
    const reviewTimes = [-3, 0, 0.5, 30, 400].map((days) => at + days * dayMs);

    const invalid = [undefined, ...memories].flatMap((memory) =>
      grades.flatMap((grade) =>
        reviewTimes
          .map((reviewedAt) => schedule(memory, grade, reviewedAt))
          .filter((next) => parseCardMemory(next).kind === 'err'),
      ),
    );

    expect(invalid).toStrictEqual([]);
  });

  it('counts days in local time: a review just after local midnight is on the next day', () => {
    // 23:30 and 00:30 in German summer time (UTC+2) are 21:30 and 22:30 UTC, one UTC day.
    const lateEvening = Date.UTC(2026, 8, 28, 21, 30);
    const afterMidnight = lateEvening + hourMs;
    const first = port(undefined, 'good', { at: lateEvening, utcOffsetMinutes: 120 });

    expect(
      port(first, 'good', { at: afterMidnight, utcOffsetMinutes: 120 }).stability,
    ).toBeGreaterThan(first.stability + 1);
    expect(schedule(first, 'good', afterMidnight).stability).toBeCloseTo(first.stability, 4);
  });

  it('keeps times real: a card is due whole days after its review, whatever the offset', () => {
    const memory = port(undefined, 'good', { at, utcOffsetMinutes: 120 });

    expect(memory.lastReviewAt).toBe(at);
    expect(Number.isInteger(daysUntilDue(memory))).toBe(true);
  });
});
