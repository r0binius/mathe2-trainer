import type { ShortcutId } from '../shortcuts/shortcutId';
import type {
  Attempt,
  PracticeItem,
  PracticeStrategy,
  Presentation,
  ProgressEffect,
} from './session';
import { testedEffect } from './session';
import type { LearnSnapshot } from './snapshot';

/** How far a shortcut got: seen with its keys (trained) or recalled without them (learned). */
export type LearnStage = 'unseen' | 'trained' | 'learned';

/** A shortcut of the set being learned. */
export type LearnEntry = {
  readonly item: PracticeItem;
  readonly stage: LearnStage;
  /** Left out for the rest of this session. It keeps its stage, so a learned one stays learned. */
  readonly skipped: boolean;
};

/** The pool of a learning session: the set's shortcuts in a stable order. */
export type LearnPool = {
  readonly entries: readonly LearnEntry[];
  /** Shortcuts whose first test of the session was reported. Later tests don't count. */
  readonly tested: readonly ShortcutId[];
};

/**
 * How likely each stage is to be picked next, as in the old app: mostly new shortcuts, now and
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
 * Starts a learning session from the shortcuts learned before (restoring a
 * {@link LearnSnapshot}). Trained ones start over as unseen, as in the old app. When every
 * shortcut is already learned, the set was completed and learning it again starts from scratch.
 */
export function learnPool(
  items: readonly PracticeItem[],
  learned: readonly ShortcutId[],
): LearnPool {
  const completed = items.every(({ id }) => learned.includes(id));

  return {
    entries: items.map((item) => ({
      item,
      stage: !completed && learned.includes(item.id) ? 'learned' : 'unseen',
      skipped: false,
    })),
    tested: [],
  };
}

/** Captures what the next session needs from this one (the Memento). */
export function snapshotLearning({ entries }: LearnPool): LearnSnapshot {
  return {
    shortcuts: entries.map(({ item }) => item.id),
    learned: entries.filter(({ stage }) => stage === 'learned').map(({ item }) => item.id),
    complete: entries.every(({ stage }) => stage === 'learned'),
  };
}

/**
 * Learning a set: new shortcuts are shown with their keys (training), the others are tested, and
 * the session ends once every shortcut that wasn't skipped is learned. Reports the first test of
 * each shortcut, and the progress whenever the learned shortcuts change.
 * @see §8 of `docs/legacy-architecture.md`
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
    const stage = attempt.mode === 'testing' && !attempt.failed ? 'learned' : 'trained';
    const firstTest = attempt.mode === 'testing' && !pool.tested.includes(attempt.item.id);
    const entries = updateEntry(pool.entries, attempt.item, (entry) => ({ ...entry, stage }));
    const next = {
      entries,
      tested: firstTest ? [...pool.tested, attempt.item.id] : pool.tested,
    };

    return {
      pool: next,
      effects: [
        ...(firstTest ? [testedEffect(attempt)] : []),
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

/** A `learnedChanged` effect if the attempt made its shortcut learned or took that away. */
function progressChange(
  before: LearnPool,
  after: LearnPool,
  { item }: Attempt,
): readonly ProgressEffect[] {
  return isLearnedIn(before, item) === isLearnedIn(after, item)
    ? []
    : [{ type: 'learnedChanged', snapshot: snapshotLearning(after) }];
}

function isLearnedIn({ entries }: LearnPool, item: PracticeItem): boolean {
  return entries.some((entry) => entry.item.id === item.id && entry.stage === 'learned');
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
  item: PracticeItem,
  update: (entry: LearnEntry) => LearnEntry,
): readonly LearnEntry[] {
  return entries.map((entry) => (entry.item.id === item.id ? update(entry) : entry));
}
