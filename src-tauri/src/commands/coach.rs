//! What the coach needs the user to allow.

use tauri::{AppHandle, State};

use crate::app::{self, CoachAccess};
use crate::error::AppError;
use crate::platform::Platform;

/// Whether the user allows what watching menu choices needs, which also starts watching once
/// both are allowed while "Learn from how I work" is on. Synchronous, so it runs on the main
/// thread, where watching starts.
#[tauri::command]
#[must_use]
#[expect(
    clippy::needless_pass_by_value,
    reason = "Tauri passes command arguments by value"
)]
pub fn get_coach_access(app: AppHandle) -> CoachAccess {
    app::coach_access(&app)
}

/// Asks the user to let the app watch clicks and key presses, by opening System Settings at Input
/// Monitoring. The first time, macOS also shows its own prompt.
///
/// # Errors
///
/// Returns a lookup error if System Settings can't be opened.
#[tauri::command]
#[expect(
    clippy::needless_pass_by_value,
    reason = "Tauri passes command arguments by value"
)]
pub fn ask_for_input_access(platform: State<'_, Platform>) -> Result<(), AppError> {
    platform.menu_choices.ask_for_input_access()
}
