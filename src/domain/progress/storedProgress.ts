import type { LayoutId } from '../keyboard/keymap';
import type { Card } from '../scheduling/scheduler';
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
