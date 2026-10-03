import type { DeckId, Item, Located, Topic } from '../content/types';

/** How many items of each deck a mock exam asks, and how long it may take. */
export type ExamPlan = {
  readonly id: string;
  readonly title: string;
  readonly minutes: number;
  readonly counts: Readonly<Record<DeckId, number>>;
};

/** The mock exam chosen until the learner picks another: long enough to mean something. */
export const defaultPlan: ExamPlan = {
  id: 'halb',
  title: 'Halbe Klausur',
  minutes: 45,
  counts: { definitions: 3, theorems: 3, claims: 8, problems: 3 },
};

/** The mock exams to choose from, the shortest first. */
export const examPlans: readonly ExamPlan[] = [
  {
    id: 'kurz',
    title: 'Kurztest',
    minutes: 20,
    counts: { definitions: 2, theorems: 2, claims: 5, problems: 1 },
  },
  defaultPlan,
  {
    id: 'voll',
    title: 'Volle Klausur',
    minutes: 90,
    counts: { definitions: 5, theorems: 5, claims: 12, problems: 6 },
  },
];

/** One task of a mock exam, with what it's worth. */
export type ExamTask = Located & {
  readonly points: number;
};

/** What stating a definition or a theorem from memory is worth. */
const statementPoints = { definition: 3, theorem: 4 } as const;

/** What an item is worth in a mock exam. */
export function pointsOf(item: Item): number {
  switch (item.kind) {
    case 'definition':
    case 'theorem':
      return statementPoints[item.kind];
    case 'claim':
      return 1;
    case 'problem':
      return item.points;
  }
}

/**
 * Composes a mock exam from the given topics: for each deck, as many items as the plan asks for,
 * picked by the seed. The same seed always gives the same exam, so it stays put while it's taken.
 */
export function composeExam(
  topics: readonly Topic[],
  plan: ExamPlan,
  seed: number,
): readonly ExamTask[] {
  return topics[0] === undefined
    ? []
    : topics[0].decks.flatMap(({ id: deck }) => {
        const pool = topics.flatMap((topic) =>
          topic.decks
            .filter(({ id }) => id === deck)
            .flatMap(({ items }) => items.map((item) => ({ item, topic, deck }))),
        );

        return shuffled(pool, seed)
          .slice(0, plan.counts[deck])
          .map((located) => ({ ...located, points: pointsOf(located.item) }));
      });
}

/**
 * The items in an order that only the seed decides: each is sorted by a hash of the seed and its
 * ID. A pure stand-in for shuffling, which would need a random generator with state.
 */
function shuffled(items: readonly Located[], seed: number): readonly Located[] {
  return items
    .map((located) => ({ located, order: hash(`${String(seed)}:${located.item.id}`) }))
    .toSorted((a, b) => a.order - b.order)
    .map(({ located }) => located);
}

/** FNV-1a, a small string hash that spreads similar inputs far apart. */
function hash(text: string): number {
  return Array.from({ length: text.length }, (_, index) => text.charCodeAt(index)).reduce(
    (value, code) => Math.imul(value ^ code, 16_777_619) >>> 0,
    2_166_136_261,
  );
}

/** What the learner did with one task: the points they gave themselves, or their verdict on a claim. */
export type ExamAnswers = {
  /** A claim's verdict, by item ID. A claim left out wasn't answered. */
  readonly verdicts: Readonly<Partial<Record<string, boolean>>>;
  /** The points the learner awarded themselves after seeing the solution, by item ID. */
  readonly awarded: Readonly<Partial<Record<string, number>>>;
};

/** The points a task earned: a claim by its verdict, anything else by what was awarded. */
export function earned({ item, points }: ExamTask, { verdicts, awarded }: ExamAnswers): number {
  if (item.kind === 'claim') {
    return verdicts[item.id] === item.holds ? points : 0;
  }

  return Math.min(points, Math.max(0, awarded[item.id] ?? 0));
}

/** An exam's points, in total and for each topic that had tasks. */
export type ExamScore = {
  readonly points: number;
  readonly max: number;
  readonly byTopic: readonly {
    readonly topic: Topic;
    readonly points: number;
    readonly max: number;
  }[];
};

/** Adds up an exam. */
export function scoreExam(tasks: readonly ExamTask[], answers: ExamAnswers): ExamScore {
  const topics = tasks
    .map(({ topic }) => topic)
    .filter((topic, index, all) => all.findIndex(({ id }) => id === topic.id) === index);

  return {
    ...sumOf(tasks, answers),
    byTopic: topics.map((topic) => ({
      topic,
      ...sumOf(
        tasks.filter((task) => task.topic.id === topic.id),
        answers,
      ),
    })),
  };
}

function sumOf(
  tasks: readonly ExamTask[],
  answers: ExamAnswers,
): { readonly points: number; readonly max: number } {
  return {
    points: tasks.reduce((sum, task) => sum + earned(task, answers), 0),
    max: tasks.reduce((sum, task) => sum + task.points, 0),
  };
}

/** A common pass mark, shown as a guide only: the lecture's own may differ. */
export const passShare = 0.5;
