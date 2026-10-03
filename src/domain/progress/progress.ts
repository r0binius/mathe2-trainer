import type { ItemId } from '../content/types';
import type { LearnSnapshot } from '../practice/snapshot';
import type { Grade, Review, ReviewCard, Scheduler } from '../scheduling/scheduler';
import { decodeCard, decodeGrade, reviewCard } from '../scheduling/scheduler';
import type { Decoder } from '../shared/decode';
import {
  array,
  dictionary,
  integer,
  literal,
  map,
  number,
  object,
  oneOf,
  optional,
  sift,
  string,
} from '../shared/decode';

/** How far learning an item got. An item without a stage is still unseen. */
export type Stage = 'trained' | 'learned';

/** One graded test, kept to show activity and weak spots. */
export type LogEntry = {
  readonly id: ItemId;
  readonly at: number;
  readonly grade: Grade;
};

/** How a mock exam went. */
export type ExamResult = {
  readonly at: number;
  readonly points: number;
  readonly max: number;
  /** How long it took, in minutes. */
  readonly minutes: number;
};

/** Everything the trainer remembers about the learner. */
export type Progress = {
  readonly stages: Readonly<Partial<Record<ItemId, Stage>>>;
  /** The review cards of the items recalled at least once. */
  readonly cards: readonly ReviewCard[];
  /** The most recent tests, oldest first, at most {@link logLimit}. */
  readonly log: readonly LogEntry[];
  readonly exams: readonly ExamResult[];
  /** When it last changed, so the newer of two copies can be told. */
  readonly updatedAt: number;
};

/** How many tests the log keeps: enough for the activity of several weeks. */
export const logLimit = 1500;

/** How many exam results are kept. */
const examLimit = 50;

/** The progress of someone who hasn't started yet. */
export const noProgress: Progress = { stages: {}, cards: [], log: [], exams: [], updatedAt: 0 };

const decodeStage: Decoder<Stage> = oneOf([literal('trained'), literal('learned')]);

const decodeLogEntry: Decoder<LogEntry> = object({ id: string, at: integer, grade: decodeGrade });

const decodeExamResult: Decoder<ExamResult> = object({
  at: integer,
  points: number,
  max: number,
  minutes: number,
});

/**
 * Decodes stored progress. Cards and log entries that no longer decode are left out instead of
 * failing the rest, and parts an older version didn't store yet start empty.
 */
export const decodeProgress: Decoder<Progress> = map(
  object({
    stages: dictionary(decodeStage),
    cards: sift(decodeCard),
    log: sift(decodeLogEntry),
    exams: optional(array(decodeExamResult)),
    updatedAt: integer,
  }),
  ({ stages, cards, log, exams, updatedAt }) => ({
    stages,
    cards: cards.valid,
    log: log.valid,
    exams: exams ?? [],
    updatedAt,
  }),
);

/**
 * The progress after a graded test: the item's card is rescheduled, or created once the item is
 * recalled for the first time, and the test joins the log.
 */
export function recordTest(scheduler: Scheduler, progress: Progress, review: Review): Progress {
  const { id, grade, at } = review;
  const reviewed = reviewCard(
    scheduler,
    progress.cards.find((card) => card.id === id),
    review,
  );
  const others = progress.cards.filter((card) => card.id !== id);

  return {
    ...progress,
    cards: reviewed === undefined ? others : [...others, reviewed],
    log: [...progress.log, { id, at, grade }].slice(-logLimit),
    updatedAt: at,
  };
}

/** The progress after a learning session changed how far its items got. */
export function recordLearning(
  progress: Progress,
  { items, learned, trained }: LearnSnapshot,
  at: number,
): Progress {
  const untouched = Object.entries(progress.stages).filter(([id]) => !items.includes(id));
  const changed = [
    ...trained.map((id) => [id, 'trained'] as const),
    ...learned.map((id) => [id, 'learned'] as const),
  ];

  return { ...progress, stages: Object.fromEntries([...untouched, ...changed]), updatedAt: at };
}

/** The progress after a mock exam was handed in. */
export function recordExam(progress: Progress, result: ExamResult): Progress {
  return {
    ...progress,
    exams: [...progress.exams, result].slice(-examLimit),
    updatedAt: result.at,
  };
}

/** The more recently changed of two copies of the progress, such as the local and the synced one. */
export function newerOf(a: Progress, b: Progress): Progress {
  return b.updatedAt > a.updatedAt ? b : a;
}
