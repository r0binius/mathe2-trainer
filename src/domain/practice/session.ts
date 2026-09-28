import type { KeyCombination } from '../keyboard/resolve';
import { isSameCombination } from '../keyboard/resolve';
import type { ShortcutId } from '../shortcuts/shortcutId';
import type { MessageKey } from '../shortcuts/types';
import type { LearnSnapshot } from './snapshot';

/** A shortcut to practice, with its keys already resolved for the current keyboard layout. */
export type PracticeItem = {
  readonly id: ShortcutId;
  readonly keys: KeyCombination;
  readonly title: MessageKey;
  readonly description?: MessageKey;
};

/** Whether the keys are shown (`training`) or have to be recalled (`testing`). */
export type Mode = 'training' | 'testing';

/** What a {@link PracticeStrategy} picks to show next. */
export type Presentation = {
  readonly item: PracticeItem;
  readonly mode: Mode;
};

/** What the strategy gets to pick the next item. */
export type Draw = {
  /** A random number in `[0, 1)`, rolled by the shell. */
  readonly roll: number;
  /** The item shown last, so the strategy can avoid repeating it right away. */
  readonly previous: PracticeItem | undefined;
};

/** How an item was answered, once its keys were pressed correctly. */
export type Attempt = {
  readonly item: PracticeItem;
  readonly mode: Mode;
  /** Wrong keys were pressed first while testing. Misses while training don't count. */
  readonly failed: boolean;
  /** Time from showing the item to the correct answer. */
  readonly durationMs: number;
};

/**
 * A practice result the shell has to save: a test that counts for reviews, or the progress of
 * learning a set.
 */
export type ProgressEffect =
  | {
      readonly type: 'tested';
      readonly id: ShortcutId;
      readonly failed: boolean;
      readonly durationMs: number;
    }
  | {
      readonly type: 'learnedChanged';
      readonly snapshot: LearnSnapshot;
    };

/** Reports an attempt as a test that counts for reviews. */
export function testedEffect({ item, failed, durationMs }: Attempt): ProgressEffect {
  return { type: 'tested', id: item.id, failed, durationMs };
}

/**
 * Work the session asks the shell to do, as data (Elm's `Cmd`): save a result, or send
 * `advance` after a pause.
 */
export type SessionEffect =
  | ProgressEffect
  | {
      readonly type: 'advanceAfter';
      readonly ms: number;
    };

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
  readonly skip: (pool: Pool, item: PracticeItem) => PoolUpdate<Pool>;
};

/**
 * A practice session, the Elm model of learning and reviewing, in one of its phases. Each phase
 * holds only what makes sense in it, so the old app's contradictory flags (`success` while
 * `testFailed`, …) can't be represented.
 */
export type Session<Pool> =
  | {
      /** An item waits for its keys. */
      readonly phase: 'presenting';
      readonly pool: Pool;
      readonly item: PracticeItem;
      readonly mode: Mode;
      readonly shownAt: number;
      /** How many wrong answers were given, so the UI can react to each one. */
      readonly misses: number;
      /** The first wrong keys of a test, shown next to the right ones. */
      readonly mistake?: KeyCombination;
    }
  | {
      /** The item was answered correctly, and the result is shown until `advance`. */
      readonly phase: 'succeeded';
      readonly pool: Pool;
      readonly item: PracticeItem;
    }
  | {
      readonly phase: 'finished';
      readonly pool: Pool;
    };

type Presenting<Pool> = Extract<Session<Pool>, { readonly phase: 'presenting' }>;

/**
 * What happened, as a message to the session. Messages carry the time and a random number, both
 * from the shell, so the session itself stays pure.
 */
export type SessionMsg =
  | { readonly type: 'answer'; readonly keys: KeyCombination; readonly at: number }
  | { readonly type: 'advance'; readonly roll: number; readonly at: number }
  | { readonly type: 'skip'; readonly roll: number; readonly at: number };

/** The session after a message, and the effects the shell has to carry out because of it. */
export type SessionUpdate<Pool> = {
  readonly model: Session<Pool>;
  readonly effects: readonly SessionEffect[];
};

/** How long a success is shown before the next item, as in the old app. */
export const successPauseMs = 1000;

/** Where the next presentation comes from: a roll, its time and the item shown before. */
type NextDraw = Draw & { readonly at: number };

/** Starts a session by presenting the strategy's first pick, or finishes it if there's none. */
export function startSession<Pool>(
  strategy: PracticeStrategy<Pool>,
  pool: Pool,
  start: { readonly roll: number; readonly at: number },
): Session<Pool> {
  return present(strategy, pool, { ...start, previous: undefined });
}

/**
 * Applies a message to the session (Elm's `update`). A message that doesn't fit the phase, such
 * as an answer while a success is shown, leaves the session unchanged.
 * @see §8–9 of `docs/legacy-architecture.md` for the flow this replaces
 */
export function updateSession<Pool>(
  strategy: PracticeStrategy<Pool>,
  session: Session<Pool>,
  msg: SessionMsg,
): SessionUpdate<Pool> {
  switch (msg.type) {
    case 'answer':
      return session.phase === 'presenting' ? answer(strategy, session, msg) : unchanged(session);
    case 'advance':
      return session.phase === 'succeeded'
        ? {
            model: present(strategy, session.pool, { ...msg, previous: session.item }),
            effects: [],
          }
        : unchanged(session);
    case 'skip':
      return session.phase === 'presenting' ? skip(strategy, session, msg) : unchanged(session);
  }
}

function present<Pool>(
  strategy: PracticeStrategy<Pool>,
  pool: Pool,
  { roll, at, previous }: NextDraw,
): Session<Pool> {
  const presentation = strategy.next(pool, { roll, previous });

  return presentation === undefined
    ? { phase: 'finished', pool }
    : { phase: 'presenting', pool, ...presentation, shownAt: at, misses: 0 };
}

function answer<Pool>(
  strategy: PracticeStrategy<Pool>,
  session: Presenting<Pool>,
  { keys, at }: { readonly keys: KeyCombination; readonly at: number },
): SessionUpdate<Pool> {
  const { item, mode, shownAt, mistake } = session;

  if (!isSameCombination(keys, item.keys)) {
    return { model: miss(session, keys), effects: [] };
  }

  const { pool, effects } = strategy.complete(session.pool, {
    item,
    mode,
    failed: mistake !== undefined,
    durationMs: at - shownAt,
  });

  return {
    model: { phase: 'succeeded', pool, item },
    effects: [...effects, { type: 'advanceAfter', ms: successPauseMs }],
  };
}

function miss<Pool>(session: Presenting<Pool>, keys: KeyCombination): Presenting<Pool> {
  const missed = { ...session, misses: session.misses + 1 };

  // Only a test remembers what was pressed: while training the right keys are on screen anyway.
  return session.mode === 'testing' ? { ...missed, mistake: session.mistake ?? keys } : missed;
}

function skip<Pool>(
  strategy: PracticeStrategy<Pool>,
  session: Presenting<Pool>,
  { roll, at }: { readonly roll: number; readonly at: number },
): SessionUpdate<Pool> {
  const { pool, effects } = strategy.skip(session.pool, session.item);

  return { model: present(strategy, pool, { roll, at, previous: session.item }), effects };
}

function unchanged<Pool>(session: Session<Pool>): SessionUpdate<Pool> {
  return { model: session, effects: [] };
}
