import type { Item, ItemId } from '../content/types';
import type { Attempt, PracticeStrategy, Presentation, ProgressEffect } from './session';
import { failed, testedEffects } from './session';
import type { LearnSnapshot } from './snapshot';

/**
 * How far an item got: seen with its answer or tested once (trained), or recalled
 * {@link recallsToLearn} times in a row (learned).
 */
export type LearnStage = 'unseen' | 'trained' | 'learned';

/** How far an item got as a learner sees it: a trained one recalled once is on its way. */
export type LearnStep = 'unseen' | 'trained' | 'recalled' | 'learned';

/**
 * How many correct recalls in a row, with other items in between, make an item learned.
 */
export const recallsToLearn = 2;

/** An item of the set being learned. */
export type LearnEntry = {
  readonly item: Item;
  readonly stage: LearnStage;
  /**
   * Correct recalls in a row in this session; a mistake starts over. Only the session counts
   * them: an item recalled fewer than {@link recallsToLearn} times is saved as trained.
   */
  readonly recalls: number;
  /** Left out for the rest of this session. It keeps its stage, so a learned one stays learned. */
  readonly skipped: boolean;
};

/** The pool of a learning session: the set's items in a stable order. */
export type LearnPool = {
  readonly entries: readonly LearnEntry[];
  /** Items whose first test of the session was reported. Later tests don't count. */
  readonly tested: readonly ItemId[];
};

/**
 * How likely each stage is to be picked next, as in the old app: mostly new items, now and
 * then a trained one, and rarely a learned one.
 */
const stageWeights: readonly (readonly [LearnStage, number])[] = [
  ['unseen', 90],
  ['trained', 50],
  ['learned', 10],
];

type Bucket = {
  readonly weight: number;
  readonly entries: readonly LearnEntry[];
};

/**
 * Starts a learning session from the progress of earlier ones (restoring a {@link LearnSnapshot}):
 * learned items start as learned and trained ones as trained, so they come as tests. When every
 * item is already learned, the set was completed and learning it again starts from scratch.
 */
export function learnPool(
  items: readonly Item[],
  progress: Pick<LearnSnapshot, 'learned' | 'trained'>,
): LearnPool {
  const { learned, trained } = progress;
  const completed = items.every(({ id }) => learned.includes(id));

  return {
    entries: items.map((item) => ({
      item,
      stage: completed ? 'unseen' : stageFrom(item.id, learned, trained),
      recalls: 0,
      skipped: false,
    })),
    tested: [],
  };
}

/** Captures what the next session needs from this one (the Memento). */
export function snapshotLearning({ entries }: LearnPool): LearnSnapshot {
  return {
    items: entries.map(({ item }) => item.id),
    learned: entries.filter(({ stage }) => stage === 'learned').map(({ item }) => item.id),
    trained: entries.filter(({ stage }) => stage === 'trained').map(({ item }) => item.id),
  };
}

/** How far an item got, telling a trained one that was recalled once from one that wasn't. */
export function stepOf({ stage, recalls }: LearnEntry): LearnStep {
  return stage === 'trained' && recalls > 0 ? 'recalled' : stage;
}

/**
 * Learning a set: new items are shown with their statement (training), the others are tested until
 * they're recalled {@link recallsToLearn} times in a row, and the session ends once every
 * item that wasn't skipped is learned. Reports the first test of
 * each item, and the progress whenever an item changes its stage.
 */
export const learnStrategy: PracticeStrategy<LearnPool> = {
  next: (pool, { roll, previous }) => {
    const active = pool.entries.filter(({ skipped }) => !skipped);
    const others = active.filter(({ item }) => item.id !== previous?.id);

    return active.every(({ stage }) => stage === 'learned')
      ? undefined
      : pickWeighted(buckets(others.length > 0 ? others : active), roll);
  },

  complete: (pool, attempt) => {
    const firstTest = attempt.mode === 'testing' && !pool.tested.includes(attempt.item.id);
    const entries = updateEntry(pool.entries, attempt.item, (entry) =>
      afterAttempt(entry, attempt),
    );
    const next = {
      entries,
      tested: firstTest ? [...pool.tested, attempt.item.id] : pool.tested,
    };

    return {
      pool: next,
      effects: [
        ...(firstTest ? testedEffects(attempt) : []),
        ...progressChange(pool, next, attempt),
      ],
    };
  },

  skip: (pool, item) => ({
    pool: {
      ...pool,
      entries: updateEntry(pool.entries, item, (entry) => ({ ...entry, skipped: true })),
    },
    effects: [],
  }),
};

/**
 * An item after it was answered: a correct recall counts towards learning it, and anything
 * else (training, or a test with a mistake) leaves it trained with the count started over. A
 * item learned in an earlier session stays learned when it's recalled.
 */
function afterAttempt(entry: LearnEntry, attempt: Attempt): LearnEntry {
  if (attempt.mode === 'training' || failed(attempt)) {
    return { ...entry, stage: 'trained', recalls: 0 };
  }

  const recalls = entry.recalls + 1;
  const learned = entry.stage === 'learned' || recalls >= recallsToLearn;

  return { ...entry, stage: learned ? 'learned' : 'trained', recalls };
}

/** A `learningChanged` effect if the attempt moved its item to another stage. */
function progressChange(
  before: LearnPool,
  after: LearnPool,
  { item }: Attempt,
): readonly ProgressEffect[] {
  return stageIn(before, item) === stageIn(after, item)
    ? []
    : [{ type: 'learningChanged', snapshot: snapshotLearning(after) }];
}

function stageIn({ entries }: LearnPool, item: Item): LearnStage | undefined {
  return entries.find((entry) => entry.item.id === item.id)?.stage;
}

function stageFrom(id: ItemId, learned: readonly ItemId[], trained: readonly ItemId[]): LearnStage {
  if (learned.includes(id)) {
    return 'learned';
  }

  return trained.includes(id) ? 'trained' : 'unseen';
}

function buckets(entries: readonly LearnEntry[]): readonly Bucket[] {
  return stageWeights
    .map(([stage, weight]) => ({
      weight,
      entries: entries.filter((entry) => entry.stage === stage),
    }))
    .filter((bucket) => bucket.entries.length > 0);
}

/**
 * Picks a bucket by weight, then an entry within it, with a single roll: where the roll falls
 * within the chosen bucket's share is again evenly distributed, so it picks the entry.
 */
function pickWeighted(choices: readonly Bucket[], roll: number): Presentation | undefined {
  const total = choices.reduce((sum, { weight }) => sum + weight, 0);

  return pickAt(choices, roll * total);
}

function pickAt(choices: readonly Bucket[], position: number): Presentation | undefined {
  const [first, ...rest] = choices;

  if (first === undefined) {
    return undefined;
  }

  // The last bucket also takes a position at the very end, which rounding can produce.
  return position < first.weight || rest.length === 0
    ? present(first, position / first.weight)
    : pickAt(rest, position - first.weight);
}

function present({ entries }: Bucket, share: number): Presentation | undefined {
  // `min` guards a share of exactly 1, which rounding can produce in the last bucket.
  const entry = entries[Math.min(Math.floor(share * entries.length), entries.length - 1)];

  return entry && { item: entry.item, mode: entry.stage === 'unseen' ? 'training' : 'testing' };
}

function updateEntry(
  entries: readonly LearnEntry[],
  item: Item,
  update: (entry: LearnEntry) => LearnEntry,
): readonly LearnEntry[] {
  return entries.map((entry) => (entry.item.id === item.id ? update(entry) : entry));
}
