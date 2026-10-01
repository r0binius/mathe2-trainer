//! What a menu item's key equivalent, as the Accessibility API describes it, means as keys of a
//! shortcut.
//!
//! Keys are named as in the shortcut data (`data/apps`): characters for the keys that type one,
//! and the frontend's key names (`ArrowUp`, `F5`) for the others, after the modifiers in ⌃⌥⇧⌘
//! order.

/// A menu item's key equivalent, as its `AXMenuItemCmd…` attributes give it.
#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct KeyEquivalent<'a> {
    /// The character it types (`AXMenuItemCmdChar`), uppercase for letters.
    pub character: Option<&'a str>,
    /// For a key without a character, its symbol in the menu (`AXMenuItemCmdGlyph`).
    pub glyph: Option<i64>,
    /// Which modifiers it needs besides ⌘, or that it needs none (`AXMenuItemCmdModifiers`).
    pub modifiers: i64,
}

/// `kAXMenuItemModifierShift`.
const SHIFT: i64 = 1 << 0;
/// `kAXMenuItemModifierOption`.
const OPTION: i64 = 1 << 1;
/// `kAXMenuItemModifierControl`.
const CONTROL: i64 = 1 << 2;
/// `kAXMenuItemModifierNoCommand`: no ⌘, which every other key equivalent includes.
const NO_COMMAND: i64 = 1 << 3;

/// The modifiers besides ⌘, with their flags, in ⌃⌥⇧ order.
const MODIFIERS: [(i64, &str); 3] = [(CONTROL, "Control"), (OPTION, "Alt"), (SHIFT, "Shift")];

/// The keys of a key equivalent, or `None` if it has no key, or one that no shortcut names.
pub fn keys_of(equivalent: KeyEquivalent) -> Option<Vec<String>> {
    let key = equivalent
        .glyph
        .filter(|&glyph| glyph != NO_GLYPH)
        .map_or_else(|| character_key(equivalent.character?), glyph_key)?;
    let command = (equivalent.modifiers & NO_COMMAND == 0).then_some("Meta");
    let modifiers = MODIFIERS
        .iter()
        .filter(|&&(flag, _)| equivalent.modifiers & flag != 0)
        .map(|&(_, name)| name)
        .chain(command);

    Some(modifiers.map(str::to_owned).chain([key]).collect())
}

/// `kMenuNullGlyph`: the item has no glyph, so its character counts.
const NO_GLYPH: i64 = 0;

/// The key a menu glyph stands for, by its `kMenu…Glyph` code from Carbon's `Menus.h`. Today's
/// SDK no longer declares them; the codes were checked against the menus of Apple's apps.
///
/// Keys no shortcut can name are left out, such as Globe (`0x95`) and Dictation (`0x96`).
fn glyph_key(glyph: i64) -> Option<String> {
    let key = match glyph {
        0x02 => "Tab",
        0x04 | 0x0b => "Enter",
        0x09 => "Space",
        0x0a => "Delete",
        0x17 => "Backspace",
        0x1b => "Escape",
        0x62 => "PageUp",
        0x64 => "ArrowLeft",
        0x65 => "ArrowRight",
        0x66 => "Home",
        0x68 => "ArrowUp",
        0x69 => "End",
        0x6a => "ArrowDown",
        0x6b => "PageDown",
        0x6f..=0x7a => return glyph.checked_sub(0x6e).map(function_key),
        0x87..=0x89 => return glyph.checked_sub(0x7a).map(function_key),
        0x8f..=0x92 => return glyph.checked_sub(0x7f).map(function_key),
        _ => return None,
    };

    Some(key.to_owned())
}

/// `F1` to `F19`.
fn function_key(number: i64) -> String {
    format!("F{number}")
}

/// The key a character stands for: the lowercase letter, a name for a control character, or the
/// character itself.
fn character_key(character: &str) -> Option<String> {
    let key = match character {
        "" => return None,
        "\r" | "\u{3}" => "Enter",
        "\t" => "Tab",
        " " => "Space",
        "\u{8}" | "\u{7f}" => "Backspace",
        "\u{1b}" => "Escape",
        _ => return Some(character.to_lowercase()),
    };

    Some(key.to_owned())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn named(keys: &[&str]) -> Vec<String> {
        keys.iter().map(|&key| key.to_owned()).collect()
    }

    #[test]
    fn adds_command_to_a_character() {
        let new = KeyEquivalent {
            character: Some("N"),
            ..KeyEquivalent::default()
        };

        assert_eq!(keys_of(new), Some(named(&["Meta", "n"])));
    }

    #[test]
    fn orders_the_modifiers_like_macos() {
        let everything = KeyEquivalent {
            character: Some("T"),
            modifiers: SHIFT | OPTION | CONTROL,
            ..KeyEquivalent::default()
        };

        assert_eq!(
            keys_of(everything),
            Some(named(&["Control", "Alt", "Shift", "Meta", "t"]))
        );
    }

    #[test]
    fn leaves_out_command_when_the_item_says_so() {
        let delete = KeyEquivalent {
            glyph: Some(0x17),
            modifiers: NO_COMMAND,
            ..KeyEquivalent::default()
        };

        assert_eq!(keys_of(delete), Some(named(&["Backspace"])));
    }

    #[test]
    fn names_the_key_of_a_glyph() {
        let up = KeyEquivalent {
            character: Some("\u{f700}"),
            glyph: Some(0x68),
            ..KeyEquivalent::default()
        };

        assert_eq!(keys_of(up), Some(named(&["Meta", "ArrowUp"])));
    }

    #[test]
    fn numbers_the_function_keys() {
        let f = |glyph| {
            keys_of(KeyEquivalent {
                glyph: Some(glyph),
                modifiers: NO_COMMAND,
                ..KeyEquivalent::default()
            })
        };

        assert_eq!(f(0x6f), Some(named(&["F1"])));
        assert_eq!(f(0x7a), Some(named(&["F12"])));
        assert_eq!(f(0x87), Some(named(&["F13"])));
        assert_eq!(f(0x92), Some(named(&["F19"])));
    }

    #[test]
    fn names_control_characters() {
        let quit_fullscreen = KeyEquivalent {
            character: Some("\u{1b}"),
            ..KeyEquivalent::default()
        };

        assert_eq!(keys_of(quit_fullscreen), Some(named(&["Meta", "Escape"])));
    }

    #[test]
    fn keeps_characters_that_are_not_letters() {
        let settings = KeyEquivalent {
            character: Some(","),
            ..KeyEquivalent::default()
        };

        assert_eq!(keys_of(settings), Some(named(&["Meta", ","])));
    }

    #[test]
    fn finds_no_keys_without_a_key() {
        assert_eq!(keys_of(KeyEquivalent::default()), None);
        assert_eq!(
            keys_of(KeyEquivalent {
                glyph: Some(0x6e),
                ..KeyEquivalent::default()
            }),
            None
        );
    }
}
