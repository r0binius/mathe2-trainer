import type { ShortcutId } from '../shortcuts/shortcutId';
import type { PracticeItem, PracticeStrategy, Presentation } from './session';
import { testedEffect } from './session';

/** How far a shortcut got in this session. */
export type LearnStage = 'unseen' | 'trained' | 'learned' | 'skipped';

/** A shortcut of the set being learned, with its stage. */
export type LearnEntry = {
  readonly item: PracticeItem;
  readonly stage: LearnStage;
};

/** The pool of a learning session: the set's shortcuts in a stable order. */
export type LearnPool = {
  readonly entries: readonly LearnEntry[];
  /** Shortcuts whose first test of the session was reported. Later tests don't count. */
  readonly tested: readonly ShortcutId[];
};

type PickableStage = Exclude<LearnStage, 'skipped'>;

/**
 * How likely each stage is to be picked next, as in the old app: mostly new shortcuts, now and
 * then a trained one, and rarely a learned one.
 */
const stageWeights: readonly (readonly [PickableStage, number])[] = [
  ['unseen', 90],
  ['trained', 50],
  ['learned', 10],
];

type Bucket = {
  readonly weight: number;
  readonly entries: readonly LearnEntry[];
};

/**
 * Starts a learning session. Shortcuts learned in earlier sessions start as learned, and trained
 * ones start over as unseen, as in the old app.
 */
export function learnPool(
  items: readonly PracticeItem[],
  learned: readonly ShortcutId[],
): LearnPool {
  return {
    entries: items.map((item) => ({
      item,
      stage: learned.includes(item.id) ? 'learned' : 'unseen',
    })),
    tested: [],
  };
}

/**
 * Learning a set: new shortcuts are shown with their keys (training), the others are tested, and
 * the session ends once every shortcut that wasn't skipped is learned.
 * @see §8 of `docs/legacy-architecture.md`
 */
export const learnStrategy: PracticeStrategy<LearnPool> = {
  next: (pool, { roll, previous }) => {
    const active = pool.entries.filter(({ stage }) => stage !== 'skipped');
    const others = active.filter(({ item }) => item.id !== previous?.id);

    return active.every(({ stage }) => stage === 'learned')
      ? undefined
      : pickWeighted(buckets(others.length > 0 ? others : active), roll);
  },

  complete: (pool, attempt) => {
    const counts = attempt.mode === 'testing' && !pool.tested.includes(attempt.item.id);
    const stage = attempt.mode === 'testing' && !attempt.failed ? 'learned' : 'trained';
    const entries = withStage(pool.entries, attempt.item, stage);

    return counts
      ? {
          pool: { entries, tested: [...pool.tested, attempt.item.id] },
          effects: [testedEffect(attempt)],
        }
      : { pool: { ...pool, entries }, effects: [] };
  },

  skip: (pool, item) => ({
    pool: { ...pool, entries: withStage(pool.entries, item, 'skipped') },
    effects: [],
  }),
};

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

function withStage(
  entries: readonly LearnEntry[],
  item: PracticeItem,
  stage: LearnStage,
): readonly LearnEntry[] {
  return entries.map((entry) => (entry.item.id === item.id ? { ...entry, stage } : entry));
}
