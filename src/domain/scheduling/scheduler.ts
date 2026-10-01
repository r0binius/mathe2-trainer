import type { LayoutId } from '../keyboard/keymap';
import type { Decoder } from '../shared/decode';
import { andThen, integer, literal, number, object, oneOf, string } from '../shared/decode';
import type { Result } from '../shared/result';
import { err, ok } from '../shared/result';
import type { ShortcutId } from '../shortcuts/shortcutId';
import { decodeShortcutId } from '../shortcuts/shortcutId';

/** How well a shortcut was recalled, on the scale FSRS schedules with. */
export type Grade = 'again' | 'hard' | 'good' | 'easy';

/** Decodes a grade. */
export const decodeGrade: Decoder<Grade> = oneOf([
  literal('again'),
  literal('hard'),
  literal('good'),
  literal('easy'),
]);

/** One day in milliseconds. Times in the domain are epoch milliseconds. */
export const dayMs = 24 * 60 * 60 * 1000;

/** The stability range FSRS works in, in days. */
const minStability = 0.001;
const maxStability = 36_500;

/** The difficulty range FSRS works in. */
const minDifficulty = 1;
const maxDifficulty = 10;

/** What the memory model knows about a shortcut, and when to review it next, unchecked. */
export type CardMemoryFields = {
  /** Days until the chance of recalling it drops to 90 %. */
  readonly stability: number;
  /** 1–10, how hard it is to raise the stability. */
  readonly difficulty: number;
  readonly lastReviewAt: number;
  readonly dueAt: number;
  readonly reps: number;
  /** How often it was forgotten after it was first recalled. */
  readonly lapses: number;
};

declare const parsed: unique symbol;

/**
 * {@link CardMemoryFields} known to be valid, so a scheduler can rely on them. Only
 * {@link parseCardMemory} and a {@link Scheduler} create one.
 *
 * The brand only guards creation: spreading a `CardMemory` with a changed field keeps it. So
 * memory is only ever changed here in `scheduling`, where each such change keeps it valid.
 */
export type CardMemory = CardMemoryFields & { readonly [parsed]: true };

/** Why memory was rejected. */
export type InvalidMemory = {
  readonly reason: 'not-finite' | 'stability' | 'difficulty' | 'counts' | 'dates';
};

/** A shortcut's review card, one per shortcut and keyboard layout. */
export type Card = CardMemory & {
  readonly id: ShortcutId;
  readonly layout: LayoutId;
};

/**
 * Computes a card's next memory after a review, or a new card's first one (the port an FSRS
 * implementation fills). It takes only valid memory, so it never has to fail. The rules of this
 * app, such as when a card is created, stay outside it.
 */
export type Scheduler = (
  memory: CardMemory | undefined,
  grade: Grade,
  time: ReviewTime,
) => CardMemory;

/**
 * When a review happened, and the local UTC offset at that moment in minutes east of UTC (+120 in
 * German summer time; `localTimeAt` in the shell). The scheduler counts days
 * in local time, the same days as {@link dueCards}.
 */
export type ReviewTime = {
  readonly at: number;
  readonly utcOffsetMinutes: number;
};

/** A graded test of a shortcut. */
export type Review = ReviewTime & {
  readonly id: ShortcutId;
  readonly layout: LayoutId;
  readonly grade: Grade;
};

type MemoryRule = (fields: CardMemoryFields) => InvalidMemory | undefined;

const memoryRules: readonly MemoryRule[] = [
  finite,
  stabilityInRange,
  difficultyInRange,
  countsConsistent,
  datesInOrder,
];

/**
 * Checks memory from outside the scheduler, such as stored cards, before a scheduler may use it.
 * It returns only the memory's own fields, so extra properties of the input don't leak through.
 */
export function parseCardMemory(fields: CardMemoryFields): Result<CardMemory, InvalidMemory> {
  const { stability, difficulty, lastReviewAt, dueAt, reps, lapses } = fields;
  const invalid = memoryRules.reduce<InvalidMemory | undefined>(
    (found, rule) => found ?? rule(fields),
    undefined,
  );

  // The cast is what the checks above establish: this is the one place memory becomes valid.
  return invalid === undefined
    ? ok({ stability, difficulty, lastReviewAt, dueAt, reps, lapses } as CardMemory)
    : err(invalid);
}

const decodeCardFields = object({
  id: decodeShortcutId,
  layout: string,
  stability: number,
  difficulty: number,
  lastReviewAt: integer,
  dueAt: integer,
  reps: integer,
  lapses: integer,
});

/** Decodes a stored card, checking its memory with {@link parseCardMemory}. */
export const decodeCard: Decoder<Card> = andThen(decodeCardFields, ({ id, layout, ...fields }) => {
  const memory = parseCardMemory(fields);

  return memory.kind === 'ok'
    ? ok({ ...memory.value, id, layout })
    : err({ path: '', expected: `valid card memory (${memory.error.reason})` });
});

/**
 * Applies a review to a shortcut's card. A shortcut only gets a card once it's recalled: failing
 * it before that is still part of learning it. A forgotten card is due a day after the review,
 * however stable the scheduler still thinks it is.
 * @see §9 of `docs/legacy-architecture.md`
 */
export function reviewCard(
  scheduler: Scheduler,
  card: Card | undefined,
  { id, layout, grade, ...time }: Review,
): Card | undefined {
  if (card === undefined && grade === 'again') {
    return undefined;
  }

  const memory = scheduler(card, grade, time);

  // From the scheduler's review time, which may be later than `at` if the clock went back.
  return {
    ...memory,
    id,
    layout,
    dueAt: grade === 'again' ? memory.lastReviewAt + dayMs : memory.dueAt,
  };
}

/**
 * The layout's cards due today, the longest overdue first. A card due any time today counts, so a
 * session in the morning also covers the evening. The shell passes the local end of today, since
 * it depends on the time zone.
 */
export function dueCards(
  cards: readonly Card[],
  layout: LayoutId,
  endOfToday: number,
): readonly Card[] {
  return cards
    .filter((card) => card.layout === layout && card.dueAt < endOfToday)
    .toSorted((a, b) => a.dueAt - b.dueAt);
}

function finite(fields: CardMemoryFields): InvalidMemory | undefined {
  const { stability, difficulty, lastReviewAt, dueAt, reps, lapses } = fields;

  return [stability, difficulty, lastReviewAt, dueAt, reps, lapses].every(Number.isFinite)
    ? undefined
    : { reason: 'not-finite' };
}

function stabilityInRange({ stability }: CardMemoryFields): InvalidMemory | undefined {
  return stability >= minStability && stability <= maxStability
    ? undefined
    : { reason: 'stability' };
}

function difficultyInRange({ difficulty }: CardMemoryFields): InvalidMemory | undefined {
  return difficulty >= minDifficulty && difficulty <= maxDifficulty
    ? undefined
    : { reason: 'difficulty' };
}

/** A card exists from its first review on, and that first review can't be a lapse. */
function countsConsistent({ reps, lapses }: CardMemoryFields): InvalidMemory | undefined {
  return Number.isInteger(reps) && Number.isInteger(lapses) && lapses >= 0 && lapses < reps
    ? undefined
    : { reason: 'counts' };
}

function datesInOrder({ lastReviewAt, dueAt }: CardMemoryFields): InvalidMemory | undefined {
  return dueAt >= lastReviewAt ? undefined : { reason: 'dates' };
}
