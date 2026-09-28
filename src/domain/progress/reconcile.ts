import type { LayoutId } from '../keyboard/keymap';
import type { Card } from '../scheduling/scheduler';
import type { ShortcutId } from '../shortcuts/shortcutId';
import { shortcutId } from '../shortcuts/shortcutId';
import type { AppDefinition, ShortcutSet } from '../shortcuts/types';
import type { SetProgress } from './setProgress';

/** A set's progress on one keyboard layout. */
export type SetRecord = {
  readonly appId: string;
  readonly setId: string;
  readonly layout: LayoutId;
  readonly progress: SetProgress;
};

/** The stored progress that depends on which shortcuts exist. */
export type ReconciledProgress = {
  readonly sets: readonly SetRecord[];
  readonly cards: readonly Card[];
};

/**
 * Removes progress of shortcuts and sets that are no longer in the data, on every keyboard
 * layout. Shortcuts that only can't be pressed on the current layout keep their progress: practice
 * leaves them out, and they may become possible again. Records and cards with nothing to remove
 * are returned as they are, so the caller can tell what changed. The review log is history and
 * isn't touched.
 * @see `CleanUp.run` in §9 of `docs/legacy-architecture.md`
 */
export function reconcileProgress(
  { sets, cards }: ReconciledProgress,
  apps: readonly AppDefinition[],
): ReconciledProgress {
  const known = new Set(
    apps.flatMap((app) => app.sets.flatMap((set) => setShortcutIds(app.id, set))),
  );

  return {
    sets: sets.flatMap((record) => reconcileSet(record, apps)),
    cards: cards.filter(({ id }) => known.has(id)),
  };
}

function reconcileSet(record: SetRecord, apps: readonly AppDefinition[]): readonly SetRecord[] {
  const set = apps
    .find(({ id }) => id === record.appId)
    ?.sets.find(({ id }) => id === record.setId);

  if (set === undefined) {
    return [];
  }

  const ids = setShortcutIds(record.appId, set);
  const learned = record.progress.learned.filter((id) => ids.includes(id));

  return learned.length === record.progress.learned.length
    ? [record]
    : [{ ...record, progress: { ...record.progress, learned } }];
}

function setShortcutIds(appId: string, set: ShortcutSet): readonly ShortcutId[] {
  return set.shortcuts.map(({ keys }) => shortcutId(appId, keys));
}
