import { shortcutsById } from '../shortcuts/lookup';
import type { ShortcutId } from '../shortcuts/shortcutId';
import { shortcutId } from '../shortcuts/shortcutId';
import type { AppDefinition, ShortcutSet } from '../shortcuts/types';
import { yourCommandsId, yourCommandsTitle } from '../usage/yourCommands';
import type { SetRecord, StoredProgress } from './storedProgress';

/**
 * Removes progress of shortcuts and sets that are no longer in the data, on every keyboard
 * layout. Shortcuts that only can't be pressed on the current layout keep their progress: practice
 * leaves them out, and they may become possible again. Records and cards with nothing to remove
 * are returned as they are, so the caller can tell what changed. The review log is history and
 * isn't touched.
 * @see `CleanUp.run` in §9 of `docs/legacy-architecture.md`
 */
export function reconcileProgress(
  { sets, cards }: StoredProgress,
  apps: readonly AppDefinition[],
): StoredProgress {
  const known = new Set(
    apps.flatMap((app) => app.sets.flatMap((set) => setShortcutIds(app.id, set))),
  );

  return {
    sets: sets.flatMap((record) => reconcileSet(record, apps)),
    cards: cards.filter(({ id }) => known.has(id)),
  };
}

/**
 * Whether reconciling changed the stored progress, so it has to be written back. It relies on
 * {@link reconcileProgress} returning what it didn't change as it was.
 */
export function progressChanged(before: StoredProgress, after: StoredProgress): boolean {
  return (
    after.cards.length !== before.cards.length ||
    after.sets.length !== before.sets.length ||
    after.sets.some((record, index) => record !== before.sets[index])
  );
}

function reconcileSet(record: SetRecord, apps: readonly AppDefinition[]): readonly SetRecord[] {
  const set = setOf(record, apps);

  if (set === undefined) {
    return [];
  }

  const ids = setShortcutIds(record.appId, set);
  const learned = record.progress.learned.filter((id) => ids.includes(id));
  const trained = record.progress.trained.filter((id) => ids.includes(id));
  const unchanged =
    learned.length === record.progress.learned.length &&
    trained.length === record.progress.trained.length;

  return unchanged ? [record] : [{ ...record, progress: { ...record.progress, learned, trained } }];
}

/**
 * The set a record belongs to. Your commands isn't in the data: its progress stays while its app
 * exists, checked against all of the app's shortcuts, since the set changes with the user's use.
 */
function setOf(record: SetRecord, apps: readonly AppDefinition[]): ShortcutSet | undefined {
  const app = apps.find(({ id }) => id === record.appId);

  return record.setId === yourCommandsId && app !== undefined
    ? { id: yourCommandsId, title: yourCommandsTitle, shortcuts: [...shortcutsById(app).values()] }
    : app?.sets.find(({ id }) => id === record.setId);
}

function setShortcutIds(appId: string, set: ShortcutSet): readonly ShortcutId[] {
  return set.shortcuts.map(({ keys }) => shortcutId(appId, keys));
}
