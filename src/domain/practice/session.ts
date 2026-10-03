import type { Item, ItemId } from '../content/types';
import type { Grade } from '../scheduling/scheduler';
import type { LearnSnapshot } from './snapshot';

/**
 * Whether an item is shown with its answer to take in (`training`), or has to be recalled or
 * solved first (`testing`).
 */
export type Mode = 'training' | 'testing';

/** What a {@link PracticeStrategy} picks to show next. */
export type Presentation = {
  readonly item: Item;
  readonly mode: Mode;
};

/** What the strategy gets to pick the next item. */
export type Draw = {
  /** A random number in `[0, 1)`, rolled by the shell. */
  readonly roll: number;
  /** The item shown last, so the strategy can avoid repeating it right away. */
  readonly previous: Item | undefined;
};

/** How an item went, once it was taken in or answered. */
export type Attempt = {
  readonly item: Item;
  readonly mode: Mode;
  /** How well it was recalled. A training has no grade: nothing was recalled yet. */
  readonly grade: Grade | undefined;
  /** When it was answered. */
  readonly at: number;
};

/** Whether an attempt was a test that went wrong. */
export function failed({ grade }: Attempt): boolean {
  return grade === 'again';
}

/**
 * A practice result the shell has to save: a test that counts for reviews, or the progress of
 * learning a deck.
 */
export type ProgressEffect =
  | {
      readonly type: 'tested';
      readonly id: ItemId;
      readonly grade: Grade;
      readonly at: number;
    }
  | {
      readonly type: 'learningChanged';
      readonly snapshot: LearnSnapshot;
    };

/** Reports an attempt as a test that counts for reviews, if it was one. */
export function testedEffects({ item, grade, at }: Attempt): readonly ProgressEffect[] {
  return grade === undefined ? [] : [{ type: 'tested', id: item.id, grade, at }];
}

/** A strategy's new pool, and the results to save because of the change. */
export type PoolUpdate<Pool> = {
  readonly pool: Pool;
  readonly effects: readonly ProgressEffect[];
};

/**
 * What differs between learning and reviewing: which items are left and how the next one is
 * picked. The `Pool` holds that state, and only the strategy looks inside it.
 */
export type PracticeStrategy<Pool> = {
  /** Picks what to show next, or `undefined` when the session is over. */
  readonly next: (pool: Pool, draw: Draw) => Presentation | undefined;
  readonly complete: (pool: Pool, attempt: Attempt) => PoolUpdate<Pool>;
  readonly skip: (pool: Pool, item: Item) => PoolUpdate<Pool>;
};

/**
 * A practice session, the Elm model of learning and reviewing, in one of its phases. Each phase
 * holds only what makes sense in it, so contradictory states can't be represented.
 */
export type Session<Pool> =
  | {
      /** An item is shown: to take in while training, to recall or judge while testing. */
      readonly phase: 'asking';
      readonly pool: Pool;
      readonly item: Item;
      readonly mode: Mode;
      /** Counts the items shown, from 1, so the UI can tell one showing from the next. */
      readonly presentation: number;
    }
  | {
      /**
       * The answer is shown. A statement or problem waits for the learner's own grade; a claim
       * was judged already, and shows whether that was right until the learner continues.
       */
      readonly phase: 'revealed';
      readonly pool: Pool;
      readonly item: Item;
      readonly presentation: number;
      /** Whether a claim was judged correctly. Absent while a grade is still to be given. */
      readonly judgedCorrectly?: boolean;
    }
  | {
      readonly phase: 'finished';
      readonly pool: Pool;
    };

type Asking<Pool> = Extract<Session<Pool>, { readonly phase: 'asking' }>;
type Revealed<Pool> = Extract<Session<Pool>, { readonly phase: 'revealed' }>;

/** A random number in `[0, 1)` the shell rolled for picking the next item, and when. */
export type Roll = { readonly roll: number; readonly at: number };

/**
 * What happened, as a message to the session. Messages carry the time and a random number, both
 * from the shell, so the session itself stays pure.
 */
export type SessionMsg =
  /** Show the answer of the statement or problem being tested. */
  | { readonly type: 'reveal' }
  /** The claim being tested was judged true or false. */
  | { readonly type: 'judge'; readonly holds: boolean; readonly at: number }
  /** The learner graded their own recall of the revealed answer. */
  | (Roll & { readonly type: 'grade'; readonly grade: Grade })
  /** Go on: a training was taken in, or a judged claim's reason was read. */
  | (Roll & { readonly type: 'continue' })
  | (Roll & { readonly type: 'skip' });

/** The session after a message, and the results the shell has to save because of it. */
export type SessionUpdate<Pool> = {
  readonly model: Session<Pool>;
  readonly effects: readonly ProgressEffect[];
};

/** Where the next presentation comes from: a roll, its number and the item before. */
type NextDraw = Draw & { readonly presentation: number };

/** Starts a session by presenting the strategy's first pick, or finishes it if there's none. */
export function startSession<Pool>(
  strategy: PracticeStrategy<Pool>,
  pool: Pool,
  roll: number,
): Session<Pool> {
  return present(strategy, pool, { roll, presentation: 1, previous: undefined });
}

/**
 * Applies a message to the session (Elm's `update`). A message that doesn't fit the phase, such
 * as a grade before the answer is revealed, leaves the session unchanged.
 */
export function updateSession<Pool>(
  strategy: PracticeStrategy<Pool>,
  session: Session<Pool>,
  msg: SessionMsg,
): SessionUpdate<Pool> {
  switch (msg.type) {
    case 'reveal':
      return unchanged(reveal(session));
    case 'judge':
      return isTested(session, 'claim') ? judge(strategy, session, msg) : unchanged(session);
    case 'grade':
      return session.phase === 'revealed' && session.judgedCorrectly === undefined
        ? complete(strategy, session, { ...msg, mode: 'testing' })
        : unchanged(session);
    case 'continue':
      return proceed(strategy, session, msg);
    case 'skip':
      return session.phase === 'finished' ? unchanged(session) : skip(strategy, session, msg);
  }
}

function present<Pool>(
  strategy: PracticeStrategy<Pool>,
  pool: Pool,
  { roll, presentation, previous }: NextDraw,
): Session<Pool> {
  const picked = strategy.next(pool, { roll, previous });

  return picked === undefined
    ? { phase: 'finished', pool }
    : { phase: 'asking', pool, item: picked.item, mode: modeFor(picked), presentation };
}

/**
 * Only statements are trained: showing a claim's verdict or a problem's solution before asking
 * would give the answer away, so those are always tested.
 */
function modeFor({ item, mode }: Presentation): Mode {
  return item.kind === 'claim' || item.kind === 'problem' ? 'testing' : mode;
}

/** Whether the session waits for the answer to an item of the given kind being tested. */
function isTested<Pool>(session: Session<Pool>, kind: Item['kind']): session is Asking<Pool> {
  return session.phase === 'asking' && session.mode === 'testing' && session.item.kind === kind;
}

/** Shows the answer of a tested statement or problem; anything else stays as it is. */
function reveal<Pool>(session: Session<Pool>): Session<Pool> {
  return session.phase === 'asking' && session.mode === 'testing' && session.item.kind !== 'claim'
    ? {
        phase: 'revealed',
        pool: session.pool,
        item: session.item,
        presentation: session.presentation,
      }
    : session;
}

/** Grades a claim by whether it was judged correctly, and shows its reason. */
function judge<Pool>(
  strategy: PracticeStrategy<Pool>,
  session: Asking<Pool>,
  { holds, at }: { readonly holds: boolean; readonly at: number },
): SessionUpdate<Pool> {
  const { item, presentation } = session;
  const judgedCorrectly = item.kind === 'claim' && item.holds === holds;
  const { pool, effects } = strategy.complete(session.pool, {
    item,
    mode: 'testing',
    grade: judgedCorrectly ? 'good' : 'again',
    at,
  });

  return { model: { phase: 'revealed', pool, item, presentation, judgedCorrectly }, effects };
}

/** Goes on after a training or a judged claim; anything else stays as it is. */
function proceed<Pool>(
  strategy: PracticeStrategy<Pool>,
  session: Session<Pool>,
  rolled: Roll,
): SessionUpdate<Pool> {
  if (session.phase === 'asking' && session.mode === 'training') {
    return complete(strategy, session, { mode: 'training', grade: undefined, ...rolled });
  }

  return session.phase === 'revealed' && session.judgedCorrectly !== undefined
    ? { model: next(strategy, session, rolled.roll), effects: [] }
    : unchanged(session);
}

function complete<Pool>(
  strategy: PracticeStrategy<Pool>,
  session: Asking<Pool> | Revealed<Pool>,
  { mode, grade, roll, at }: Pick<Attempt, 'mode' | 'grade'> & Roll,
): SessionUpdate<Pool> {
  const { pool, effects } = strategy.complete(session.pool, {
    item: session.item,
    mode,
    grade,
    at,
  });

  return { model: next(strategy, { ...session, pool }, roll), effects };
}

/** Presents what follows the session's current item, from its pool. */
function next<Pool>(
  strategy: PracticeStrategy<Pool>,
  { pool, item, presentation }: Asking<Pool> | Revealed<Pool>,
  roll: number,
): Session<Pool> {
  return present(strategy, pool, { roll, presentation: presentation + 1, previous: item });
}

function skip<Pool>(
  strategy: PracticeStrategy<Pool>,
  session: Asking<Pool> | Revealed<Pool>,
  { roll }: Roll,
): SessionUpdate<Pool> {
  const { pool, effects } = strategy.skip(session.pool, session.item);

  return { model: next(strategy, { ...session, pool }, roll), effects };
}

function unchanged<Pool>(session: Session<Pool>): SessionUpdate<Pool> {
  return { model: session, effects: [] };
}
