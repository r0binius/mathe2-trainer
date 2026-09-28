import type { Result } from '../shared/result';
import { err, ok } from '../shared/result';
import type { KeyAlternatives, KeyCombination } from './combination';
import { isModifier, isSameCombination } from './combination';
import type { Keymap } from './keymap';
import { resolveKeys } from './resolve';

/** Why a combination can't be practiced. */
export type Rejection =
  | { readonly reason: 'duplicate-key'; readonly key: string }
  | { readonly reason: 'modifier-only' }
  | { readonly reason: 'reserved' };

/** One check of a {@link ShortcutPolicy}: a rejection, or `undefined` when the keys pass. */
export type PolicyRule = (keys: KeyCombination) => Rejection | undefined;

/** Rules checked in order. The first one that rejects the keys decides. */
export type ShortcutPolicy = readonly PolicyRule[];

/**
 * Combinations macOS handles itself, so the practice window would never receive them. Pressing
 * one during practice switches apps, takes a screenshot or even locks the screen.
 *
 * They're written as resolved keys, like the combinations they're compared with.
 */
export const macosReserved: readonly KeyCombination[] = [
  ['Meta', 'Tab'], // switch apps
  ['Meta', 'Space'], // Spotlight
  ['Alt', 'Meta', 'Space'], // Finder search
  ['Control', 'Space'], // previous input source
  ['Control', 'Alt', 'Space'], // next input source
  ['Shift', 'Meta', '3'], // screenshot
  ['Shift', 'Meta', '4'], // screenshot of a selection
  ['Shift', 'Meta', '5'], // screenshot tool
  ['Shift', 'Meta', '6'], // screenshot of the Touch Bar
  ['Alt', 'Meta', 'Escape'], // force quit
  ['Control', 'Meta', 'q'], // lock screen
  ['Control', 'Meta', 'd'], // look up in the dictionary
  ['Alt', 'Meta', 'd'], // show or hide the Dock
  ['F11'], // show the desktop
  ['Control', 'ArrowUp'], // Mission Control
  ['Control', 'ArrowDown'], // application windows
  ['Control', 'ArrowLeft'], // previous space
  ['Control', 'ArrowRight'], // next space
];

/** Rejects a combination with a key in it twice, such as Shift + `?` once `?` resolved to Shift + `ß`. */
export function noDuplicateKeys(keys: KeyCombination): Rejection | undefined {
  const duplicate = keys.find((key, index) => keys.indexOf(key) !== index);

  return duplicate === undefined ? undefined : { reason: 'duplicate-key', key: duplicate };
}

/** Rejects a combination without a key that isn't a modifier, since pressing it does nothing. */
export function notModifierOnly(keys: KeyCombination): Rejection | undefined {
  return keys.every(isModifier) ? { reason: 'modifier-only' } : undefined;
}

/**
 * Builds a rule rejecting exactly the given combinations, in any modifier order.
 *
 * A combination that only contains a reserved one, such as ⇧⌘Tab for ⌘Tab, passes.
 */
export function notReserved(reserved: readonly KeyCombination[]): PolicyRule {
  return function checkReserved(keys) {
    return reserved.some((combination) => isSameCombination(combination, keys))
      ? { reason: 'reserved' }
      : undefined;
  };
}

/**
 * The rules a shortcut has to pass to be practiced.
 *
 * `reserved` holds the platform's list, such as {@link macosReserved}, plus Mouseless's own trigger.
 * The caller rebuilds the policy when the trigger changes.
 */
export function practicePolicy(reserved: readonly KeyCombination[]): ShortcutPolicy {
  return [noDuplicateKeys, notModifierOnly, notReserved(reserved)];
}

/** Checks resolved keys against a policy: the keys, or the first rule's rejection. */
export function checkShortcut(
  policy: ShortcutPolicy,
  keys: KeyCombination,
): Result<KeyCombination, Rejection> {
  const rejection = policy.reduce<Rejection | undefined>(
    (found, rule) => found ?? rule(keys),
    undefined,
  );

  return rejection === undefined ? ok(keys) : err(rejection);
}

/**
 * The keys to practice a shortcut with on the given keymap: the shortest of its alternatives that
 * the policy allows, the first one if several are equally short, or `undefined` if the policy
 * rejects them all. Unlike the old app, a reserved shortest alternative doesn't hide a shortcut
 * that another alternative lets you practice.
 */
export function practicableKeys(
  keymap: Keymap,
  alternatives: KeyAlternatives,
  policy: ShortcutPolicy,
): KeyCombination | undefined {
  return alternatives
    .map((keys) => resolveKeys(keymap, keys))
    .filter((keys) => checkShortcut(policy, keys).kind === 'ok')
    .reduce<KeyCombination | undefined>(
      (shortest, keys) =>
        shortest === undefined || keys.length < shortest.length ? keys : shortest,
      undefined,
    );
}
