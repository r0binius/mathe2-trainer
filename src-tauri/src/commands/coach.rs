//! What the coach needs the user to allow, and the banner it shows.

use tauri::{AppHandle, State};

use crate::app::{self, Banner, CoachAccess, WatchedShortcut};
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
    platform.work_watch.ask_for_input_access()
}

/// Shows a shortcut's title and keys in the banner below the menu bar for a moment, in place of
/// the one before. Synchronous, so it runs on the main thread, where macOS changes windows.
///
/// # Errors
///
/// Returns a window error if the banner can't be placed, told what to show, or shown.
#[tauri::command]
#[expect(
    clippy::needless_pass_by_value,
    reason = "Tauri passes command arguments by value"
)]
pub fn show_banner(app: AppHandle, banner: Banner) -> Result<(), AppError> {
    app::show_banner(&app, &banner).map_err(|source| AppError::Window { source })
}

/// Counts presses of these learned shortcuts from now on, in place of the ones before, while
/// learning from work is on. Synchronous, so it runs on the main thread, where the platform
/// watches.
#[tauri::command]
#[expect(
    clippy::needless_pass_by_value,
    reason = "Tauri passes command arguments by value"
)]
pub fn set_watched_shortcuts(app: AppHandle, shortcuts: Vec<WatchedShortcut>) {
    app::watch_shortcuts(&app, shortcuts);
}
