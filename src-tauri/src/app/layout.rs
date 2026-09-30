//! Following the keyboard layout the user selects: the frontend reads it again, and the trigger's
//! shortcut moves to the key that now types its character.

use tauri::{AppHandle, Emitter};
use tauri_plugin_log::log;

use super::trigger;
use crate::error::AppError;
use crate::platform::Platform;

/// The event the frontend reads the layout again on. It carries nothing.
const KEYMAP_CHANGED: &str = "keymap-changed";

/// Follows every change the user may have made to the layout, for as long as the app runs.
///
/// # Errors
///
/// Returns a keymap error if the system doesn't let the app observe the layout.
pub fn follow_changes(app: &AppHandle, platform: &Platform) -> Result<(), AppError> {
    let app = app.clone();

    platform.keymap.watch_changes(Box::new(move || {
        trigger::follow_layout(&app);
        if let Err(error) = app.emit(KEYMAP_CHANGED, ()) {
            log::error!("cannot tell the frontend the layout changed: {error}");
        }
    }))
}
