//! Looking up other apps' menus.

use tauri::{AppHandle, State};

use crate::app;
use crate::error::AppError;
use crate::platform::{MenuGroup, Platform};

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

/// The shortcuts in the menus of the app the popover opened over, by menu, in menu bar order.
///
/// # Errors
///
/// Returns a lookup error if the popover didn't open over an app, access isn't granted, or the
/// app doesn't answer in time.
#[tauri::command]
pub async fn read_menu_shortcuts(app: AppHandle) -> Result<Vec<MenuGroup>, AppError> {
    app::read_menus(app).await
}
