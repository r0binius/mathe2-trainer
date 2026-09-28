import type { KeyCombination } from '../keyboard/combination';
import { macosReserved } from '../keyboard/policy';
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

/**
 * The combinations practice can't use with this trigger: those macOS handles itself, plus the
 * popover's shortcut, which Mouseless catches before practice sees it.
 */
export function reservedFor(trigger: Trigger): readonly KeyCombination[] {
  switch (trigger.kind) {
    case 'holdCommand':
      return macosReserved;
    case 'shortcut':
      return [...macosReserved, trigger.keys];
  }
}
