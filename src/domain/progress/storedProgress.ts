import type { LayoutId } from '../keyboard/keymap';
import type { Card } from '../scheduling/scheduler';
import { decodeCard } from '../scheduling/scheduler';
import type { DecodeError, Decoder } from '../shared/decode';
import { array, at, integer, map, object, optional, sift, string } from '../shared/decode';
import { decodeShortcutId } from '../shortcuts/shortcutId';
import type { SetProgress } from './setProgress';

/** A set's progress on one keyboard layout. */
export type SetRecord = {
  readonly appId: string;
  readonly setId: string;
  readonly layout: LayoutId;
  readonly progress: SetProgress;
};

/**
 * The stored progress that depends on which shortcuts exist, on every layout: what's loaded at
 * startup, reconciled with the data and written back. The review log isn't part of it, since it's
 * history.
 */
export type StoredProgress = {
  readonly sets: readonly SetRecord[];
  readonly cards: readonly Card[];
};

/** Loaded progress, and why the stored items that were left out don't decode any more. */
export type LoadedProgress = {
  readonly progress: StoredProgress;
  readonly skipped: readonly DecodeError[];
};

const decodeSetProgress = object({
  learned: array(decodeShortcutId),
  completedAt: optional(integer),
  updatedAt: integer,
});

/** Decodes a stored set record. */
export const decodeSetRecord: Decoder<SetRecord> = object({
  appId: string,
  setId: string,
  layout: string,
  progress: decodeSetProgress,
});

/**
 * Decodes the loaded progress. A record or card that doesn't decode is skipped and reported
 * instead of failing the rest: one damaged card shouldn't lock the user out of their progress.
 * Only a response of the wrong shape as a whole fails.
 */
export const decodeStoredProgress: Decoder<LoadedProgress> = map(
  object({ sets: sift(decodeSetRecord), cards: sift(decodeCard) }),
  ({ sets, cards }) => ({
    progress: { sets: sets.valid, cards: cards.valid },
    skipped: [
      ...sets.invalid.map((error) => at('sets', error)),
      ...cards.invalid.map((error) => at('cards', error)),
    ],
  }),
);
