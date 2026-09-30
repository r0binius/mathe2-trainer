//! Keymap fixtures for the frontend's tests, read from the layout in use by the `dump_keymap`
//! example.

use crate::platform::macos::input_source;
use crate::platform::macos::keymap::Keyboard;

/// The ID of the keyboard layout in use and its keymap as fixture JSON, for the `dump_keymap`
/// example. With `ansi`, keys are translated as on an ANSI keyboard, whatever keyboard is
/// connected.
///
/// # Errors
///
/// Returns an error if the layout can't be read, such as off the main thread.
pub fn dump_keymap(ansi: bool) -> Result<(String, String), Box<dyn std::error::Error>> {
    let layout = input_source::current_layout(ansi.then_some(Keyboard::Ansi))?;

    Ok((layout.id, serde_json::to_string_pretty(&layout.keymap)?))
}
