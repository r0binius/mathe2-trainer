//! What the app needs from the operating system, as traits (the ports), and their implementation
//! for the platform the app is built for.
//!
//! The rest of the app works against the traits, so a platform is added without changing it (the
//! Bridge pattern in `architecture.md`).

// Wired to the `get_keymap` command in step 6.3; the expectation fails once that uses it.
#![expect(dead_code, reason = "not wired to a command yet")]

mod key_code;
#[cfg(target_os = "macos")]
mod macos;

use std::collections::BTreeMap;

use serde::Serialize;

pub use key_code::KeyCode;

use crate::error::AppError;

/// The characters one key types without a modifier and with Shift, Option (Alt) or both.
///
/// A combination that types nothing is an empty string.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KeyCharacters {
    /// Without a modifier.
    pub value: String,
    /// With Shift.
    pub with_shift: String,
    /// With Option (Alt).
    pub with_alt: String,
    /// With Shift and Option.
    pub with_shift_alt: String,
}

/// What each key types on a keyboard layout, in keyboard order.
///
/// Keys the keyboard doesn't have are left out, such as `IntlBackslash` on an ANSI keyboard.
pub type Keymap = BTreeMap<KeyCode, KeyCharacters>;

/// A keyboard layout and what its keys type, in the shape of the frontend's `CurrentLayout`.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct Layout {
    /// The system's ID of the layout, such as `com.apple.keylayout.German`. Progress is kept per
    /// layout, so the ID must not change with the system language.
    pub id: String,
    /// What each key types.
    pub keymap: Keymap,
}

/// Reads the keyboard layout in use.
pub trait KeymapSource {
    /// The layout the user types with right now.
    ///
    /// # Errors
    ///
    /// Returns an error if the system doesn't report a layout or its key tables.
    fn current_layout(&self) -> Result<Layout, AppError>;
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn reaches_the_frontend_in_the_shape_of_its_current_layout() {
        let characters = KeyCharacters {
            value: "^".to_owned(),
            with_shift: "°".to_owned(),
            with_alt: "„".to_owned(),
            with_shift_alt: "“".to_owned(),
        };
        let layout = Layout {
            id: "com.apple.keylayout.German".to_owned(),
            keymap: Keymap::from([(KeyCode::Backquote, characters)]),
        };

        assert_eq!(
            serde_json::to_value(&layout).ok(),
            Some(json!({
                "id": "com.apple.keylayout.German",
                "keymap": {
                    "Backquote": { "value": "^", "withShift": "°", "withAlt": "„", "withShiftAlt": "“" },
                },
            })),
        );
    }
}
