//! Window requests from the frontend, which go to the window coordinator like any other event.

use tauri::AppHandle;

use crate::app::{self, Event};
use crate::error::AppError;

/// Closes the popover from inside it (Escape), giving focus back to the app it was opened over.
///
/// Synchronous on purpose: Tauri runs it on the main thread, where macOS changes windows.
///
/// # Errors
///
/// Returns a window error if macOS doesn't let the app close the popover or hide itself.
#[tauri::command]
#[expect(
    clippy::needless_pass_by_value,
    reason = "Tauri passes command arguments by value"
)]
pub fn dismiss_popover(app: AppHandle) -> Result<(), AppError> {
    app::handle(&app, Event::PopoverDismissed)
}
