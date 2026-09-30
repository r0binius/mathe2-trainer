//! Turning the trigger's keys, named as the frontend's `KeyCombination`, into a global shortcut on
//! the current layout.

use std::str::FromStr;

use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut};

use crate::error::AppError;
use crate::platform::Keymap;

/// The global shortcut for `keys`, named as the frontend's `KeyCombination`: modifiers, and one key
/// by the character it types without a modifier on `keymap`, or by its code if it types nothing.
///
/// # Errors
///
/// Returns a trigger error if there isn't exactly one key besides the modifiers, or the key isn't
/// one a global shortcut can use.
pub fn shortcut_of(keys: &[String], keymap: &Keymap) -> Result<Shortcut, AppError> {
    let (modifiers, others): (Vec<_>, Vec<_>) = keys
        .iter()
        .map(String::as_str)
        .partition(|key| modifier_of(key).is_some());
    let [key] = others.as_slice() else {
        return Err(AppError::trigger(format!(
            "a shortcut needs exactly one key besides the modifiers: {keys:?}"
        )));
    };
    let modifiers = modifiers
        .iter()
        .filter_map(|key| modifier_of(key))
        .fold(Modifiers::empty(), |all, modifier| all | modifier);

    Ok(Shortcut::new(Some(modifiers), code_of(key, keymap)?))
}

fn modifier_of(key: &str) -> Option<Modifiers> {
    match key {
        "Control" => Some(Modifiers::CONTROL),
        "Alt" => Some(Modifiers::ALT),
        "Shift" => Some(Modifiers::SHIFT),
        "Meta" => Some(Modifiers::SUPER),
        _ => None,
    }
}

/// The physical key for `key`: the one typing it on `keymap`, else the key it names. A `KeyCode`'s
/// name is also the plugin's name for the key.
fn code_of(key: &str, keymap: &Keymap) -> Result<Code, AppError> {
    let name = keymap
        .iter()
        .find(|(_, characters)| characters.value == key)
        .map_or(key, |(code, _)| code.as_str());

    Code::from_str(name).map_err(|_| AppError::trigger(format!("no key types {key:?}")))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::platform::{KeyCharacters, KeyCode};

    fn german() -> Keymap {
        let key = |value: &str| KeyCharacters {
            value: value.to_owned(),
            with_shift: value.to_uppercase(),
            with_alt: String::new(),
            with_shift_alt: String::new(),
        };

        Keymap::from([(KeyCode::KeyY, key("z")), (KeyCode::KeyZ, key("y"))])
    }

    fn keys(names: &[&str]) -> Vec<String> {
        names.iter().map(ToString::to_string).collect()
    }

    #[test]
    fn finds_the_key_typing_the_character_on_the_layout() {
        let shortcut = shortcut_of(&keys(&["Shift", "Meta", "z"]), &german()).expect("a shortcut");

        assert_eq!(
            shortcut,
            Shortcut::new(Some(Modifiers::SHIFT | Modifiers::SUPER), Code::KeyY)
        );
    }

    #[test]
    fn takes_a_key_that_types_nothing_by_its_code() {
        let shortcut =
            shortcut_of(&keys(&["Control", "Alt", "F6"]), &german()).expect("a shortcut");

        assert_eq!(
            shortcut,
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::F6)
        );
    }

    #[test]
    fn needs_exactly_one_key_besides_the_modifiers() {
        assert!(shortcut_of(&keys(&["Meta"]), &german()).is_err());
        assert!(shortcut_of(&keys(&["Meta", "z", "y"]), &german()).is_err());
    }

    #[test]
    fn rejects_a_character_no_key_types() {
        assert!(shortcut_of(&keys(&["Meta", "ß"]), &german()).is_err());
    }
}
