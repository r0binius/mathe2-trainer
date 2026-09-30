//! The physical keys that type characters.

use serde::Serialize;

/// A physical key that types characters, named by its
/// [`KeyboardEvent.code`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code),
/// as the frontend's `KeyCode`.
///
/// A name comes from the key's position on a US keyboard, not from what it types: `KeyY` types
/// `z` on a German layout. The names are WebKit's, which crosses two on ISO keyboards (see
/// `key_positions` in the macOS keymap). The variants are in keyboard order, the frontend's `keyCodes`, which is
/// also the order of a [`Keymap`](super::Keymap).
#[derive(Copy, Clone, Debug, Eq, Ord, PartialEq, PartialOrd, Serialize)]
pub enum KeyCode {
    Backquote,
    Digit1,
    Digit2,
    Digit3,
    Digit4,
    Digit5,
    Digit6,
    Digit7,
    Digit8,
    Digit9,
    Digit0,
    Minus,
    Equal,
    KeyQ,
    KeyW,
    KeyE,
    KeyR,
    KeyT,
    KeyY,
    KeyU,
    KeyI,
    KeyO,
    KeyP,
    BracketLeft,
    BracketRight,
    KeyA,
    KeyS,
    KeyD,
    KeyF,
    KeyG,
    KeyH,
    KeyJ,
    KeyK,
    KeyL,
    Semicolon,
    Quote,
    Backslash,
    IntlBackslash,
    KeyZ,
    KeyX,
    KeyC,
    KeyV,
    KeyB,
    KeyN,
    KeyM,
    Comma,
    Period,
    Slash,
    Space,
    NumpadEqual,
    NumpadDivide,
    NumpadMultiply,
    Numpad7,
    Numpad8,
    Numpad9,
    NumpadSubtract,
    Numpad4,
    Numpad5,
    Numpad6,
    NumpadAdd,
    Numpad1,
    Numpad2,
    Numpad3,
    Numpad0,
    NumpadDecimal,
}

impl KeyCode {
    /// The key's name, as its [`KeyboardEvent.code`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code)
    /// and as it reaches the frontend.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Backquote => "Backquote",
            Self::Digit1 => "Digit1",
            Self::Digit2 => "Digit2",
            Self::Digit3 => "Digit3",
            Self::Digit4 => "Digit4",
            Self::Digit5 => "Digit5",
            Self::Digit6 => "Digit6",
            Self::Digit7 => "Digit7",
            Self::Digit8 => "Digit8",
            Self::Digit9 => "Digit9",
            Self::Digit0 => "Digit0",
            Self::Minus => "Minus",
            Self::Equal => "Equal",
            Self::KeyQ => "KeyQ",
            Self::KeyW => "KeyW",
            Self::KeyE => "KeyE",
            Self::KeyR => "KeyR",
            Self::KeyT => "KeyT",
            Self::KeyY => "KeyY",
            Self::KeyU => "KeyU",
            Self::KeyI => "KeyI",
            Self::KeyO => "KeyO",
            Self::KeyP => "KeyP",
            Self::BracketLeft => "BracketLeft",
            Self::BracketRight => "BracketRight",
            Self::KeyA => "KeyA",
            Self::KeyS => "KeyS",
            Self::KeyD => "KeyD",
            Self::KeyF => "KeyF",
            Self::KeyG => "KeyG",
            Self::KeyH => "KeyH",
            Self::KeyJ => "KeyJ",
            Self::KeyK => "KeyK",
            Self::KeyL => "KeyL",
            Self::Semicolon => "Semicolon",
            Self::Quote => "Quote",
            Self::Backslash => "Backslash",
            Self::IntlBackslash => "IntlBackslash",
            Self::KeyZ => "KeyZ",
            Self::KeyX => "KeyX",
            Self::KeyC => "KeyC",
            Self::KeyV => "KeyV",
            Self::KeyB => "KeyB",
            Self::KeyN => "KeyN",
            Self::KeyM => "KeyM",
            Self::Comma => "Comma",
            Self::Period => "Period",
            Self::Slash => "Slash",
            Self::Space => "Space",
            Self::NumpadEqual => "NumpadEqual",
            Self::NumpadDivide => "NumpadDivide",
            Self::NumpadMultiply => "NumpadMultiply",
            Self::Numpad7 => "Numpad7",
            Self::Numpad8 => "Numpad8",
            Self::Numpad9 => "Numpad9",
            Self::NumpadSubtract => "NumpadSubtract",
            Self::Numpad4 => "Numpad4",
            Self::Numpad5 => "Numpad5",
            Self::Numpad6 => "Numpad6",
            Self::NumpadAdd => "NumpadAdd",
            Self::Numpad1 => "Numpad1",
            Self::Numpad2 => "Numpad2",
            Self::Numpad3 => "Numpad3",
            Self::Numpad0 => "Numpad0",
            Self::NumpadDecimal => "NumpadDecimal",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn is_named_as_it_reaches_the_frontend() {
        for code in [
            KeyCode::Backquote,
            KeyCode::KeyY,
            KeyCode::IntlBackslash,
            KeyCode::NumpadDecimal,
        ] {
            assert_eq!(
                serde_json::to_value(code).expect("a key code serializes"),
                code.as_str()
            );
        }
    }
}
