//! The keyboard layout in use and what its keys type, and the trait that reads it.

use std::collections::BTreeMap;

use serde::Serialize;

use crate::error::AppError;
use crate::platform::KeyCode;

/// The characters one key types without a modifier and with Shift, Option (Alt) or both.
///
/// A combination that types nothing is an empty string.
#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
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
#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
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

    /// Calls `on_change` whenever the user may have selected another layout, for as long as the
    /// app runs. The layout may also be the same one, so read it again and compare. Call it once:
    /// the observation is never removed.
    ///
    /// # Errors
    ///
    /// Returns an error if the system doesn't let the app observe the layout, or if it's observed
    /// already.
    fn watch_changes(&self, on_change: Box<dyn Fn()>) -> Result<(), AppError>;
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

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
            serde_json::to_value(&layout).expect("a layout serializes"),
            json!({
                "id": "com.apple.keylayout.German",
                "keymap": {
                    "Backquote": { "value": "^", "withShift": "°", "withAlt": "„", "withShiftAlt": "“" },
                },
            }),
        );
    }
}
