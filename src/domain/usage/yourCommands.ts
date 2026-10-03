import type { ShortcutId } from '../shortcuts/shortcutId';
import { shortcutId } from '../shortcuts/shortcutId';
import type {
  AppDefinition,
  MessageKey,
  ShortcutDefinition,
  ShortcutSet,
} from '../shortcuts/types';
import type { UsageCount } from './usageCount';

/** The ID of the set made from the user's menu choices, which the data never uses. */
export const yourCommandsId = 'your-commands';

/** Its title, which every app's catalog gets when the translations are set up. */
export const yourCommandsTitle: MessageKey = 'yourCommands.title';

/**
 * The set of an app's shortcuts the user chose from its menus, over the days of `counts`, the
 * most chosen first, or `undefined` if there's none. It's learned like the app's own sets.
 * @see §5 of `docs/specs/science-backed-training.md`
 */
export function yourCommands(
  app: AppDefinition,
  counts: readonly UsageCount[],
): ShortcutSet | undefined {
  const definitions = new Map(
    app.sets.flatMap(({ shortcuts }) =>
      shortcuts.map((shortcut) => [shortcutId(app.id, shortcut.keys), shortcut] as const),
    ),
  );
  const shortcuts = [...menuChoices(counts)]
    .toSorted(([, a], [, b]) => b - a)
    .flatMap(([id]) => definitions.get(id) ?? []);

  return shortcuts.length === 0
    ? undefined
    : { id: yourCommandsId, title: yourCommandsTitle, shortcuts };
}

/** How often each shortcut was chosen from a menu, over all the days of `counts`. */
function menuChoices(counts: readonly UsageCount[]): ReadonlyMap<ShortcutId, number> {
  return counts
    .filter(({ byMenu }) => byMenu > 0)
    .reduce(
      (totals, { id, byMenu }) => new Map([...totals, [id, (totals.get(id) ?? 0) + byMenu]]),
      new Map<ShortcutId, number>(),
    );
}

/** The definitions of every shortcut of an app, for checking Your commands' stored progress. */
export function allShortcuts(app: AppDefinition): readonly ShortcutDefinition[] {
  return app.sets.flatMap(({ shortcuts }) => shortcuts);
}
