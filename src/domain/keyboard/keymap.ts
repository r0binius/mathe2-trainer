/**
 * A physical key that types characters, named by its
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code | KeyboardEvent.code}.
 *
 * The name comes from the key's position on a US keyboard, not from what it types: `KeyY` types
 * `z` on a German layout. Keys that type nothing (arrows, F-keys, modifiers) aren't included.
 */
export type KeyCode =
  | 'Backquote'
  | 'Digit1'
  | 'Digit2'
  | 'Digit3'
  | 'Digit4'
  | 'Digit5'
  | 'Digit6'
  | 'Digit7'
  | 'Digit8'
  | 'Digit9'
  | 'Digit0'
  | 'Minus'
  | 'Equal'
  | 'KeyQ'
  | 'KeyW'
  | 'KeyE'
  | 'KeyR'
  | 'KeyT'
  | 'KeyY'
  | 'KeyU'
  | 'KeyI'
  | 'KeyO'
  | 'KeyP'
  | 'BracketLeft'
  | 'BracketRight'
  | 'KeyA'
  | 'KeyS'
  | 'KeyD'
  | 'KeyF'
  | 'KeyG'
  | 'KeyH'
  | 'KeyJ'
  | 'KeyK'
  | 'KeyL'
  | 'Semicolon'
  | 'Quote'
  | 'Backslash'
  | 'IntlBackslash'
  | 'KeyZ'
  | 'KeyX'
  | 'KeyC'
  | 'KeyV'
  | 'KeyB'
  | 'KeyN'
  | 'KeyM'
  | 'Comma'
  | 'Period'
  | 'Slash'
  | 'Space'
  | 'NumpadEqual'
  | 'NumpadDivide'
  | 'NumpadMultiply'
  | 'Numpad7'
  | 'Numpad8'
  | 'Numpad9'
  | 'NumpadSubtract'
  | 'Numpad4'
  | 'Numpad5'
  | 'Numpad6'
  | 'NumpadAdd'
  | 'Numpad1'
  | 'Numpad2'
  | 'Numpad3'
  | 'Numpad0'
  | 'NumpadDecimal';

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
