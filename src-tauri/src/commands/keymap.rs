//! Reading the keyboard layout.

use tauri::State;

use crate::error::AppError;
use crate::platform::{Layout, Platform};

/// Returns the keyboard layout in use and what each key types.
///
/// Synchronous on purpose: Tauri runs it on the main thread, the only one macOS reads input
/// sources on.
///
/// # Errors
///
/// Returns a keymap error if the system doesn't report the layout.
#[tauri::command]
#[expect(
    clippy::needless_pass_by_value,
    reason = "Tauri passes command arguments by value, `State` included"
)]
pub fn get_keymap(platform: State<'_, Platform>) -> Result<Layout, AppError> {
    platform.keymap.current_layout()
}
