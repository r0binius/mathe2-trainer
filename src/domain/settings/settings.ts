import type { KeyCombination } from '../keyboard/combination';
import type { Decoder } from '../shared/decode';
import { array, boolean, literal, object, oneOf, string } from '../shared/decode';

/** How the popover is opened: by holding ⌘ on its own for a moment, or by a global shortcut. */
export type Trigger =
  { readonly kind: 'holdCommand' } | { readonly kind: 'shortcut'; readonly keys: KeyCombination };

/** Everything the user can set. Rust owns the defaults and sends the full settings. */
export type Settings = {
  readonly trigger: Trigger;
  readonly showMenuBarIcon: boolean;
  readonly showDockIcon: boolean;
  readonly launchAtLogin: boolean;
};

const decodeTrigger: Decoder<Trigger> = oneOf([
  object({ kind: literal('holdCommand') }),
  object({ kind: literal('shortcut'), keys: array(string) }),
]);

/** Decodes the settings. */
export const decodeSettings: Decoder<Settings> = object({
  trigger: decodeTrigger,
  showMenuBarIcon: boolean,
  showDockIcon: boolean,
  launchAtLogin: boolean,
});
