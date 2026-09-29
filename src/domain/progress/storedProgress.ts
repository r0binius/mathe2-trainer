import type { LayoutId } from '../keyboard/keymap';
import type { Card } from '../scheduling/scheduler';
import { decodeCard } from '../scheduling/scheduler';
import type { DecodeError, Decoder } from '../shared/decode';
import { array, at, integer, map, object, optional, sift, string } from '../shared/decode';
import { decodeShortcutId } from '../shortcuts/shortcutId';
import type { SetProgress } from './setProgress';

/** Which set a progress record is for: a set of an app, on one keyboard layout. */
export type SetKey = {
  readonly appId: string;
  readonly setId: string;
  readonly layout: LayoutId;
};

/** A set's progress on one keyboard layout. */
export type SetRecord = SetKey & { readonly progress: SetProgress };

/** Which card: a shortcut, on one keyboard layout. */
export type CardKey = Pick<Card, 'id' | 'layout'>;

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
  trained: array(decodeShortcutId),
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

/** The progress of the given set, or `undefined` if it was never learned on that layout. */
export function setProgressOf(stored: StoredProgress, key: SetKey): SetProgress | undefined {
  return stored.sets.find((record) => isSameSet(record, key))?.progress;
}

/** The stored progress with the record of its set and layout replaced, or added. */
export function withSetRecord(stored: StoredProgress, record: SetRecord): StoredProgress {
  return { ...stored, sets: replaceOrAdd(stored.sets, record, isSameSet) };
}

/** The card of the given shortcut and layout, or `undefined` if it was never recalled there. */
export function cardOf(stored: StoredProgress, key: CardKey): Card | undefined {
  return stored.cards.find((card) => isSameCard(card, key));
}

/** The stored progress with the card of its shortcut and layout replaced, or added. */
export function withCard(stored: StoredProgress, card: Card): StoredProgress {
  return { ...stored, cards: replaceOrAdd(stored.cards, card, isSameCard) };
}

function isSameSet(first: SetKey, second: SetKey): boolean {
  return (
    first.appId === second.appId && first.setId === second.setId && first.layout === second.layout
  );
}

function isSameCard(first: CardKey, second: CardKey): boolean {
  return first.id === second.id && first.layout === second.layout;
}

function replaceOrAdd<T>(
  items: readonly T[],
  item: T,
  isSame: (first: T, second: T) => boolean,
): readonly T[] {
  return items.some((existing) => isSame(existing, item))
    ? items.map((existing) => (isSame(existing, item) ? item : existing))
    : [...items, item];
}
