//! Builds the Tauri app: its plugins, managed state, commands and menu bar icon.

use std::sync::Arc;

use tauri::Manager;

use super::{popover, tray};
use crate::error::AppError;
use crate::services::database::Database;
use crate::{commands, platform};

/// Builds and runs the app until it quits.
///
/// # Errors
///
/// Returns an error if Tauri fails to start or stops with an error.
pub fn run() -> tauri::Result<()> {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .setup(|app| {
            let directory = app
                .path()
                .app_data_dir()
                .map_err(|source| AppError::FindDataDirectory { source })?;
            app.manage(Arc::new(Database::open_in(&directory)?));
            let platform = platform::current();
            commands::keymap::emit_changes(app.handle(), &platform)?;
            app.manage(platform);
            popover::hide_on_blur(app.handle())?;
            tray::create(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::keymap::get_keymap,
            commands::progress::load_progress,
            commands::progress::save_set_progress,
            commands::progress::record_review,
            commands::progress::replace_progress,
            commands::progress::reset_progress,
            commands::settings::get_settings,
            commands::settings::set_settings,
        ])
        .run(tauri::generate_context!())
}
