//! Reading the keyboard layout, and telling the frontend when it changes.

use tauri::{AppHandle, Emitter, State};

use crate::app;
use crate::error::AppError;
use crate::platform::{Layout, Platform};

/// The event the frontend reads the layout again on. It carries nothing.
pub const KEYMAP_CHANGED: &str = "keymap-changed";

/// Emits [`KEYMAP_CHANGED`] whenever the user may have selected another layout, and registers the
/// trigger's shortcut again for it.
///
/// # Errors
///
/// Returns a keymap error if the system doesn't let the app observe the layout.
pub fn emit_changes(app: &AppHandle, platform: &Platform) -> Result<(), AppError> {
    let app = app.clone();

    platform.keymap.watch_changes(Box::new(move || {
        app::follow_layout(&app);
        if let Err(error) = app.emit(KEYMAP_CHANGED, ()) {
            tauri_plugin_log::log::error!("cannot tell the frontend the layout changed: {error}");
        }
    }))?;
    Ok(())
}

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
