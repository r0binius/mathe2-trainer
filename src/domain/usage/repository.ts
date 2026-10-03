import type { LayoutId } from '../keyboard/keymap';
import type { PlatformError } from '../shared/platformError';
import type { Result } from '../shared/result';
import type { ShortcutId } from '../shortcuts/shortcutId';

/** One use of a shortcut: which, on which layout and local day, and whether by keys or menu. */
export type ShortcutUse = {
  readonly id: ShortcutId;
  readonly layout: LayoutId;
  /** The local day number, as `localDay` counts it. */
  readonly day: number;
  readonly by: 'keys' | 'menu';
};

/** Where the uses of shortcuts are counted, per day. */
export type UsageRepository = {
  /** Counts one use. Nothing is counted once learning from work is off. */
  readonly recordUse: (shortcutUse: ShortcutUse) => Promise<Result<void, PlatformError>>;
};
