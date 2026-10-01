//! Looking up other apps' menus.

use tauri::State;

use crate::error::AppError;
use crate::platform::Platform;

/// Asks the user to let the app read other apps' menus, by opening System Settings at
/// Accessibility. The first time, macOS also shows its own prompt.
///
/// # Errors
///
/// Returns a lookup error if System Settings can't be opened.
#[tauri::command]
#[expect(
    clippy::needless_pass_by_value,
    reason = "Tauri passes command arguments by value"
)]
pub fn ask_for_menu_access(platform: State<'_, Platform>) -> Result<(), AppError> {
    platform.menus.ask_for_access()
}
