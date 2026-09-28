import type { Card } from '../scheduling/scheduler';
import type { ShortcutId } from '../shortcuts/shortcutId';
import { shortcutId } from '../shortcuts/shortcutId';
import type { AppDefinition, ShortcutSet } from '../shortcuts/types';
import type { SetProgress } from './setProgress';

/** A set's progress with the set it belongs to. The repository may add its own keys. */
export type SetRecord = {
  readonly appId: string;
  readonly setId: string;
  readonly progress: SetProgress;
};

/** The stored progress that depends on which shortcuts exist. */
export type ReconciledProgress<S extends SetRecord, C extends Card> = {
  readonly sets: readonly S[];
  readonly cards: readonly C[];
};

/**
 * Removes progress of shortcuts and sets that are no longer in the data, on every keyboard
 * layout. Shortcuts that only can't be pressed on the current layout keep their progress: practice
 * leaves them out, and they may become possible again. Records and cards with nothing to remove
 * are returned as they are, so the caller can tell what changed. The review log is history and
 * isn't touched.
 * @see `CleanUp.run` in §9 of `docs/legacy-architecture.md`
 */
export function reconcileProgress<S extends SetRecord, C extends Card>(
  { sets, cards }: ReconciledProgress<S, C>,
  apps: readonly AppDefinition[],
): ReconciledProgress<S, C> {
  const known = new Set(
    apps.flatMap((app) => app.sets.flatMap((set) => setShortcutIds(app.id, set))),
  );

  return {
    sets: sets.flatMap((record) => reconcileSet(record, apps)),
    cards: cards.filter(({ id }) => known.has(id)),
  };
}

function reconcileSet<S extends SetRecord>(
  record: S,
  apps: readonly AppDefinition[],
): readonly S[] {
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
