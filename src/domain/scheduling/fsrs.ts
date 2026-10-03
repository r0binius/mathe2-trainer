import type { Card as FsrsCard, Grade as FsrsGrade } from 'ts-fsrs';
import { createEmptyCard, fsrs, Rating, State } from 'ts-fsrs';

import type { CardMemory, CardMemoryFields, Grade, ReviewTime } from './scheduler';
import { dayMs } from './scheduler';

/** The longest interval between reviews, as in the old app. */
export const maximumIntervalDays = 365;

const minuteMs = 60 * 1000;

/** The chance of recalling an item that reviews are planned for. */
const desiredRetention = 0.9;

const ratings: Readonly<Record<Grade, FsrsGrade>> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

/**
 * FSRS-6 with its default weights. It's configuration, not state: `next` keeps nothing between
 * calls.
 *
 * Short-term learning steps are off: this app has its own learning mode, and plans reviews in
 * whole days. Fuzz spreads out cards learned together; `ts-fsrs` seeds it from the card and the
 * review time, so the result is still deterministic.
 */
const algorithm = fsrs({
  request_retention: desiredRetention,
  maximum_interval: maximumIntervalDays,
  enable_fuzz: true,
  enable_short_term: false,
});

/**
 * The {@link Scheduler} backed by `ts-fsrs`. A review timed before the card's last one, because
 * the clock was set back, counts as made at the last one: FSRS rejects negative elapsed time.
 *
 * `ts-fsrs` counts elapsed days between UTC calendar dates. The times it gets are shifted by the
 * local UTC offset, so its days are local days, and its due date is shifted back.
 */
export function scheduleWithFsrs(
  memory: CardMemory | undefined,
  grade: Grade,
  { at, utcOffsetMinutes }: ReviewTime,
): CardMemory {
  const reviewedAt = memory === undefined ? at : Math.max(at, memory.lastReviewAt);
  const shiftMs = utcOffsetMinutes * minuteMs;
  const { card } = algorithm.next(
    toFsrs(memory, reviewedAt, shiftMs),
    reviewedAt + shiftMs,
    ratings[grade],
  );

  // Valid by construction: ts-fsrs clamps stability and difficulty to their ranges, and the counts
  // and dates follow from the review. A test checks this over a grid of inputs.
  return { ...fromFsrs(card, shiftMs), lastReviewAt: reviewedAt } as CardMemory;
}

function toFsrs(memory: CardMemory | undefined, at: number, shiftMs: number): FsrsCard {
  return memory === undefined
    ? createEmptyCard(at + shiftMs)
    : {
        due: new Date(memory.dueAt + shiftMs),
        stability: memory.stability,
        difficulty: memory.difficulty,
        elapsed_days: 0,
        scheduled_days: Math.round((memory.dueAt - memory.lastReviewAt) / dayMs),
        learning_steps: 0,
        reps: memory.reps,
        lapses: memory.lapses,
        // Without short-term steps, a card is reviewed from its first grade on.
        state: State.Review,
        last_review: new Date(memory.lastReviewAt + shiftMs),
      };
}

function fromFsrs(
  card: Readonly<FsrsCard>,
  shiftMs: number,
): Omit<CardMemoryFields, 'lastReviewAt'> {
  return {
    stability: card.stability,
    difficulty: card.difficulty,
    dueAt: card.due.getTime() - shiftMs,
    reps: card.reps,
    lapses: card.lapses,
  };
}
