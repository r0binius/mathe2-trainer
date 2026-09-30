import type { Decoder } from '../shared/decode';
import { object, partialRecord, string } from '../shared/decode';
import type { Loadable } from '../shared/loadable';
import { loadableOf } from '../shared/loadable';
import type { PlatformError } from '../shared/platformError';
import type { Result } from '../shared/result';

/**
 * The physical keys that type characters, in keyboard order, named by their
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code | KeyboardEvent.code}.
 *
 * A name comes from the key's position on a US keyboard, not from what it types: `KeyY` types
 * `z` on a German layout. Keys that type nothing (arrows, F-keys, modifiers) aren't included.
 * The names are the webview's: on ISO keyboards WebKit calls the key left of 1 `IntlBackslash`
 * and the key next to left Shift `Backquote`, so the keymap does too.
 *
 * The order is fixed so that key resolution doesn't depend on the order in which the keymap's
 * entries arrive: when two keys type the same character, the earlier one wins.
 */
export const keyCodes = [
  'Backquote',
  'Digit1',
  'Digit2',
  'Digit3',
  'Digit4',
  'Digit5',
  'Digit6',
  'Digit7',
  'Digit8',
  'Digit9',
  'Digit0',
  'Minus',
  'Equal',
  'KeyQ',
  'KeyW',
  'KeyE',
  'KeyR',
  'KeyT',
  'KeyY',
  'KeyU',
  'KeyI',
  'KeyO',
  'KeyP',
  'BracketLeft',
  'BracketRight',
  'KeyA',
  'KeyS',
  'KeyD',
  'KeyF',
  'KeyG',
  'KeyH',
  'KeyJ',
  'KeyK',
  'KeyL',
  'Semicolon',
  'Quote',
  'Backslash',
  'IntlBackslash',
  'KeyZ',
  'KeyX',
  'KeyC',
  'KeyV',
  'KeyB',
  'KeyN',
  'KeyM',
  'Comma',
  'Period',
  'Slash',
  'Space',
  'NumpadEqual',
  'NumpadDivide',
  'NumpadMultiply',
  'Numpad7',
  'Numpad8',
  'Numpad9',
  'NumpadSubtract',
  'Numpad4',
  'Numpad5',
  'Numpad6',
  'NumpadAdd',
  'Numpad1',
  'Numpad2',
  'Numpad3',
  'Numpad0',
  'NumpadDecimal',
] as const;

/** A physical key that types characters, one of {@link keyCodes}. */
export type KeyCode = (typeof keyCodes)[number];

/** The characters one key types without a modifier and with Shift, Alt (Option) or both. */
export type KeyCharacters = {
  readonly value: string;
  readonly withShift: string;
  readonly withAlt: string;
  readonly withShiftAlt: string;
};

/**
 * What each key types on the current keyboard layout.
 *
 * Partial, because a layout may leave keys out (a keyboard without a numpad, say).
 */
export type Keymap = Readonly<Partial<Record<KeyCode, KeyCharacters>>>;

/**
 * Identifies a keyboard layout, such as `com.apple.keylayout.German` (the macOS input source ID).
 * Progress is kept per layout. The ID stays the same when the system language changes, unlike the
 * layout's localized name, which the old app used.
 */
export type LayoutId = string;

/** The keyboard layout in use, and what its keys type. */
export type CurrentLayout = {
  readonly id: LayoutId;
  readonly keymap: Keymap;
};

const decodeKeyCharacters: Decoder<KeyCharacters> = object({
  value: string,
  withShift: string,
  withAlt: string,
  withShiftAlt: string,
});

/**
 * Decodes the layout the Rust side reads. Keys it reports that aren't {@link keyCodes}, such as
 * those of a Japanese keyboard, are left out.
 */
export const decodeCurrentLayout: Decoder<CurrentLayout> = object({
  id: string,
  keymap: partialRecord(keyCodes, decodeKeyCharacters),
});

/**
 * The layout after the system reported a change and it was read again. The change may keep the
 * same layout (input methods report changes too), and then the state stays the very same, so
 * nothing computed from it runs again. A layout that fails to read keeps the one that's loaded.
 */
export function afterLayoutChange(
  current: Loadable<CurrentLayout>,
  read: Result<CurrentLayout, PlatformError>,
): Loadable<CurrentLayout> {
  if (current.status !== 'loaded') {
    return loadableOf(read);
  }

  return read.kind === 'err' || read.value.id === current.value.id
    ? current
    : { status: 'loaded', value: read.value };
}
