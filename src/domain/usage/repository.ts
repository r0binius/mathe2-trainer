import type { LayoutId } from '../keyboard/keymap';
import type { PlatformError } from '../shared/platformError';
import type { Result } from '../shared/result';
import type { ShortcutId } from '../shortcuts/shortcutId';

/** One use of a shortcut chosen from a menu: which, on which layout, and on which local day. */
export type MenuUse = {
  readonly id: ShortcutId;
  readonly layout: LayoutId;
  /** The local day number, as `localDay` counts it. */
  readonly day: number;
};

/** Where the uses of shortcuts are counted, per day. */
export type UsageRepository = {
  /** Counts one use from a menu. Nothing is counted once learning from work is off. */
  readonly recordMenuUse: (menuUse: MenuUse) => Promise<Result<void, PlatformError>>;
};
