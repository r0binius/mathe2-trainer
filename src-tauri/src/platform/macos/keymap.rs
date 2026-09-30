//! Where each key sits in macOS's key codes, the part of reading a layout that needs no system
//! call.
//!
//! macOS names a key by its virtual key code (`kVK_…` in `HIToolbox/Events.h`), and `UCKeyTranslate`
//! tells what that key types. Each code gets the name WebKit's `event.code` gives it, since key
//! capture looks keys up by that name.

use crate::platform::KeyCode;

/// The physical kind of keyboard, as `KBGetLayoutType` reports it.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Keyboard {
    /// The US shape: a wide Enter and a long left Shift. JIS keyboards count as ANSI here, since
    /// they lack the ISO key too.
    Ansi,
    /// The European shape: a tall Enter and an extra key next to left Shift.
    Iso,
}

/// `kVK_ISO_Section`: the key left of 1 on ISO keyboards. ANSI keyboards don't have it.
const ISO_SECTION: u16 = 0x0A;

/// The virtual key codes of every key that types characters, on an ANSI keyboard, in keyboard
/// order. Keys like Return, Tab and the arrows type no characters and aren't listed.
///
/// `kVK_ANSI_Grave` (0x32) is the key left of 1 on ANSI but the key next to left Shift on ISO.
/// WebKit calls it `Backquote` on both, so it's `Backquote` here too.
const ANSI_POSITIONS: [(u16, KeyCode); 64] = [
    (0x32, KeyCode::Backquote),
    (0x12, KeyCode::Digit1),
    (0x13, KeyCode::Digit2),
    (0x14, KeyCode::Digit3),
    (0x15, KeyCode::Digit4),
    (0x17, KeyCode::Digit5),
    (0x16, KeyCode::Digit6),
    (0x1A, KeyCode::Digit7),
    (0x1C, KeyCode::Digit8),
    (0x19, KeyCode::Digit9),
    (0x1D, KeyCode::Digit0),
    (0x1B, KeyCode::Minus),
    (0x18, KeyCode::Equal),
    (0x0C, KeyCode::KeyQ),
    (0x0D, KeyCode::KeyW),
    (0x0E, KeyCode::KeyE),
    (0x0F, KeyCode::KeyR),
    (0x11, KeyCode::KeyT),
    (0x10, KeyCode::KeyY),
    (0x20, KeyCode::KeyU),
    (0x22, KeyCode::KeyI),
    (0x1F, KeyCode::KeyO),
    (0x23, KeyCode::KeyP),
    (0x21, KeyCode::BracketLeft),
    (0x1E, KeyCode::BracketRight),
    (0x00, KeyCode::KeyA),
    (0x01, KeyCode::KeyS),
    (0x02, KeyCode::KeyD),
    (0x03, KeyCode::KeyF),
    (0x05, KeyCode::KeyG),
    (0x04, KeyCode::KeyH),
    (0x26, KeyCode::KeyJ),
    (0x28, KeyCode::KeyK),
    (0x25, KeyCode::KeyL),
    (0x29, KeyCode::Semicolon),
    (0x27, KeyCode::Quote),
    (0x2A, KeyCode::Backslash),
    (0x06, KeyCode::KeyZ),
    (0x07, KeyCode::KeyX),
    (0x08, KeyCode::KeyC),
    (0x09, KeyCode::KeyV),
    (0x0B, KeyCode::KeyB),
    (0x2D, KeyCode::KeyN),
    (0x2E, KeyCode::KeyM),
    (0x2B, KeyCode::Comma),
    (0x2F, KeyCode::Period),
    (0x2C, KeyCode::Slash),
    (0x31, KeyCode::Space),
    (0x51, KeyCode::NumpadEqual),
    (0x4B, KeyCode::NumpadDivide),
    (0x43, KeyCode::NumpadMultiply),
    (0x59, KeyCode::Numpad7),
    (0x5B, KeyCode::Numpad8),
    (0x5C, KeyCode::Numpad9),
    (0x4E, KeyCode::NumpadSubtract),
    (0x56, KeyCode::Numpad4),
    (0x57, KeyCode::Numpad5),
    (0x58, KeyCode::Numpad6),
    (0x45, KeyCode::NumpadAdd),
    (0x53, KeyCode::Numpad1),
    (0x54, KeyCode::Numpad2),
    (0x55, KeyCode::Numpad3),
    (0x52, KeyCode::Numpad0),
    (0x41, KeyCode::NumpadDecimal),
];

/// Every key on the keyboard, with the virtual key code macOS reports for it.
///
/// An ISO keyboard has one more key, [`ISO_SECTION`] left of 1, which WebKit calls
/// `IntlBackslash`, a name the W3C gives the key next to left Shift. The two keys are named
/// crossed on ISO, but the same way as `event.code`, which is what matters.
pub fn key_positions(keyboard: Keyboard) -> impl Iterator<Item = (u16, KeyCode)> {
    let iso_key = match keyboard {
        Keyboard::Ansi => None,
        Keyboard::Iso => Some((ISO_SECTION, KeyCode::IntlBackslash)),
    };

    ANSI_POSITIONS.into_iter().chain(iso_key)
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeSet;

    use super::*;

    fn key_code_of(virtual_key: u16, keyboard: Keyboard) -> Option<KeyCode> {
        key_positions(keyboard).find_map(|(key, code)| (key == virtual_key).then_some(code))
    }

    #[test]
    fn names_keys_by_their_position_not_by_what_they_type() {
        assert_eq!(key_code_of(0x06, Keyboard::Iso), Some(KeyCode::KeyZ));
        assert_eq!(key_code_of(0x10, Keyboard::Iso), Some(KeyCode::KeyY));
    }

    #[test]
    fn names_the_two_iso_keys_as_webkit_does() {
        // On ISO, 0x0A is the key left of 1 and 0x32 the one next to left Shift, but WebKit's
        // `event.code` names them by their ANSI codes, and key capture looks keys up by it.
        assert_eq!(
            key_code_of(0x0A, Keyboard::Iso),
            Some(KeyCode::IntlBackslash)
        );
        assert_eq!(key_code_of(0x32, Keyboard::Iso), Some(KeyCode::Backquote));
    }

    #[test]
    fn on_ansi_the_key_left_of_1_is_backquote_and_there_is_no_intl_backslash() {
        assert_eq!(key_code_of(0x32, Keyboard::Ansi), Some(KeyCode::Backquote));
        assert_eq!(key_code_of(0x0A, Keyboard::Ansi), None);
    }

    #[test]
    fn leaves_out_keys_that_type_no_characters() {
        let (return_key, left_arrow) = (0x24, 0x7B);

        assert_eq!(key_code_of(return_key, Keyboard::Iso), None);
        assert_eq!(key_code_of(left_arrow, Keyboard::Iso), None);
    }

    #[test]
    fn an_iso_keyboard_has_every_key_once() {
        let positions: Vec<_> = key_positions(Keyboard::Iso).collect();
        let codes: BTreeSet<_> = positions.iter().map(|&(_, code)| code).collect();
        let keys: BTreeSet<_> = positions.iter().map(|&(key, _)| key).collect();

        assert_eq!(positions.len(), 65);
        assert_eq!(codes.len(), 65);
        assert_eq!(keys.len(), 65);
    }

    #[test]
    fn an_ansi_keyboard_has_every_key_but_intl_backslash() {
        let codes: BTreeSet<_> = key_positions(Keyboard::Ansi)
            .map(|(_, code)| code)
            .collect();

        assert_eq!(codes.len(), 64);
        assert!(!codes.contains(&KeyCode::IntlBackslash));
    }
}
