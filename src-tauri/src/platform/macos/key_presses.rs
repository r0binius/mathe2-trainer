//! Telling key presses apart by the physical key and modifiers macOS reports, for the shortcuts
//! the coach watches.
//!
//! The frontend names a shortcut's keys as the shortcut data does, resolved on the layout
//! (`['Shift', 'Meta', 'ß']`). A key that types a character is found by what it types on the
//! layout; one that types none (an arrow, `F5`) by its name.

use objc2_core_graphics::{CGEventFlags, CGEventType};

use crate::platform::Keymap;
use crate::platform::macos::event_tap::TapEvent;
use crate::platform::macos::keymap::{Keyboard, key_positions};

/// The modifiers a shortcut can name. Caps Lock and fn don't count: macOS sets fn for the arrows
/// and function keys themselves.
const MODIFIERS: [(&str, CGEventFlags); 4] = [
    ("Control", CGEventFlags::MaskControl),
    ("Alt", CGEventFlags::MaskAlternate),
    ("Shift", CGEventFlags::MaskShift),
    ("Meta", CGEventFlags::MaskCommand),
];

/// The virtual key codes (`kVK_…` in Carbon's `Events.h`) of the keys that type no character, by
/// the names the shortcut data gives them.
const NAMED_KEYS: [(&str, u16); 27] = [
    ("Enter", 0x24),
    ("Tab", 0x30),
    ("Space", 0x31),
    ("Backspace", 0x33),
    ("Escape", 0x35),
    ("Delete", 0x75),
    ("Home", 0x73),
    ("End", 0x77),
    ("PageUp", 0x74),
    ("PageDown", 0x79),
    ("ArrowLeft", 0x7B),
    ("ArrowRight", 0x7C),
    ("ArrowDown", 0x7D),
    ("ArrowUp", 0x7E),
    ("F1", 0x7A),
    ("F2", 0x78),
    ("F3", 0x63),
    ("F4", 0x76),
    ("F5", 0x60),
    ("F6", 0x61),
    ("F7", 0x62),
    ("F8", 0x64),
    ("F9", 0x65),
    ("F10", 0x6D),
    ("F11", 0x67),
    ("F12", 0x6F),
    ("F13", 0x69),
];

/// A key going down with modifiers, as macOS reports it.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct Press {
    /// The virtual key code.
    key: u16,
    /// The modifiers held, of [`MODIFIERS`] only.
    modifiers: CGEventFlags,
}

/// The presses that type `keys` on `keymap`: one for every key typing its character, such as
/// the 2 in the top row and on the keypad, as macOS triggers a menu item's key equivalent with
/// either. None if it isn't exactly one key besides the modifiers, or no key on the keyboard is
/// it.
pub fn presses_of(keys: &[String], keymap: &Keymap) -> Vec<Press> {
    let (modifiers, others): (Vec<_>, Vec<_>) = keys
        .iter()
        .map(String::as_str)
        .partition(|key| modifier(key).is_some());
    let [key] = others.as_slice() else {
        return Vec::new();
    };
    let modifiers = modifiers
        .iter()
        .filter_map(|name| modifier(name))
        .fold(CGEventFlags::empty(), CGEventFlags::union);

    virtual_keys(key, keymap)
        .into_iter()
        .map(|key| Press { key, modifiers })
        .collect()
}

/// The press a key-down event of the tap is, or `None` for any other event.
pub fn press_from(event: TapEvent) -> Option<Press> {
    let all = MODIFIERS
        .iter()
        .fold(CGEventFlags::empty(), |all, &(_, flag)| all.union(flag));

    (event.kind == CGEventType::KeyDown)
        .then(|| u16::try_from(event.key_code).ok())
        .flatten()
        .map(|key| Press {
            key,
            modifiers: event.flags.intersection(all),
        })
}

fn modifier(name: &str) -> Option<CGEventFlags> {
    MODIFIERS
        .iter()
        .find_map(|&(modifier, flag)| (modifier == name).then_some(flag))
}

/// The keys typing `key` without a modifier on `keymap`, else the named key `key` is.
///
/// Keys are found by their ISO positions, which hold every ANSI key too: the extra ISO key never
/// comes up on an ANSI keyboard.
fn virtual_keys(key: &str, keymap: &Keymap) -> Vec<u16> {
    let typing: Vec<u16> = keymap
        .iter()
        .filter(|(_, characters)| characters.value == key)
        .filter_map(|(&code, _)| {
            key_positions(Keyboard::Iso)
                .find_map(|(virtual_key, position)| (position == code).then_some(virtual_key))
        })
        .collect();

    if typing.is_empty() {
        NAMED_KEYS
            .iter()
            .filter(|&&(name, _)| name == key)
            .map(|&(_, virtual_key)| virtual_key)
            .collect()
    } else {
        typing
    }
}

#[cfg(test)]
mod tests {
    use objc2_core_foundation::CGPoint;

    use super::*;
    use crate::platform::{KeyCharacters, KeyCode};

    /// The German layout's keys that the tests use: 2 in the top row and on the keypad, ß on
    /// `Minus`, z on `KeyY`, n on `KeyN`.
    fn german() -> Keymap {
        let key = |value: &str| KeyCharacters {
            value: value.to_owned(),
            with_shift: value.to_uppercase(),
            with_alt: String::new(),
            with_shift_alt: String::new(),
        };

        Keymap::from([
            (KeyCode::Digit2, key("2")),
            (KeyCode::Minus, key("ß")),
            (KeyCode::KeyY, key("z")),
            (KeyCode::KeyN, key("n")),
            (KeyCode::Numpad2, key("2")),
        ])
    }

    fn keys(names: &[&str]) -> Vec<String> {
        names.iter().map(ToString::to_string).collect()
    }

    fn key_down(key_code: i64, flags: CGEventFlags) -> TapEvent {
        TapEvent {
            kind: CGEventType::KeyDown,
            flags,
            key_code,
            location: CGPoint::default(),
        }
    }

    #[test]
    fn finds_a_character_by_the_key_typing_it_on_the_layout() {
        let help = presses_of(&keys(&["Shift", "Meta", "ß"]), &german());
        let pressed = press_from(key_down(
            0x1B,
            CGEventFlags::MaskShift.union(CGEventFlags::MaskCommand),
        ));

        assert_eq!(help, pressed.into_iter().collect::<Vec<_>>());
    }

    #[test]
    fn finds_a_key_by_its_position_not_its_ansi_name() {
        // z is on the key the US layout calls Y.
        assert_eq!(
            presses_of(&keys(&["Meta", "z"]), &german()),
            press_from(key_down(0x10, CGEventFlags::MaskCommand))
                .into_iter()
                .collect::<Vec<_>>()
        );
    }

    #[test]
    fn finds_a_key_that_types_nothing_by_its_name() {
        let next = presses_of(&keys(&["Alt", "Meta", "ArrowRight"]), &german());
        // macOS adds fn to the arrows, which no shortcut names.
        let pressed = press_from(key_down(
            0x7C,
            CGEventFlags::MaskAlternate
                .union(CGEventFlags::MaskCommand)
                .union(CGEventFlags::MaskSecondaryFn),
        ));

        assert_eq!(next, pressed.into_iter().collect::<Vec<_>>());
    }

    #[test]
    fn finds_every_key_typing_the_character_such_as_the_keypads() {
        let presses = presses_of(&keys(&["Meta", "2"]), &german());
        let top_row = press_from(key_down(0x13, CGEventFlags::MaskCommand));
        let keypad = press_from(key_down(0x54, CGEventFlags::MaskCommand));

        assert_eq!(
            presses,
            [top_row, keypad].into_iter().flatten().collect::<Vec<_>>()
        );
    }

    #[test]
    fn tells_other_modifiers_apart() {
        let pressed = press_from(key_down(
            0x2D,
            CGEventFlags::MaskShift.union(CGEventFlags::MaskCommand),
        ));

        assert!(!presses_of(&keys(&["Meta", "n"]), &german()).contains(&pressed.expect("a press")));
    }

    #[test]
    fn ignores_caps_lock() {
        let pressed = press_from(key_down(
            0x2D,
            CGEventFlags::MaskCommand.union(CGEventFlags::MaskAlphaShift),
        ));

        assert!(presses_of(&keys(&["Meta", "n"]), &german()).contains(&pressed.expect("a press")));
    }

    #[test]
    fn needs_exactly_one_key_it_can_find() {
        assert_eq!(presses_of(&keys(&["Meta"]), &german()), []);
        assert_eq!(presses_of(&keys(&["Meta", "n", "z"]), &german()), []);
        assert_eq!(presses_of(&keys(&["Meta", "q"]), &german()), []);
    }

    #[test]
    fn only_a_key_going_down_is_a_press() {
        let up = TapEvent {
            kind: CGEventType::KeyUp,
            ..key_down(0x2D, CGEventFlags::MaskCommand)
        };

        assert_eq!(press_from(up), None);
    }
}
