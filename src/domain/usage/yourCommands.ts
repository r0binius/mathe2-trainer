import { shortcutsById } from '../shortcuts/lookup';
import type { AppDefinition, MessageKey, ShortcutSet } from '../shortcuts/types';
import type { UsageCount } from './usageCount';
import { menuTotals } from './usageCount';

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
  const definitions = shortcutsById(app);
  const shortcuts = [...menuTotals(counts)]
    .toSorted(([, a], [, b]) => b - a)
    .flatMap(([id]) => definitions.get(id) ?? []);

  return shortcuts.length === 0
    ? undefined
    : { id: yourCommandsId, title: yourCommandsTitle, shortcuts };
}
