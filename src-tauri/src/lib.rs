//! Mouseless: keyboard shortcut training and look-up.
//!
//! The library builds the Tauri app, and `main.rs` only calls [`run`].

mod commands;
mod error;
mod services;

use tauri::Manager;

use crate::error::AppError;
use crate::services::database::Database;

/// Builds and runs the app until it quits.
///
/// # Errors
///
/// Returns an error if Tauri fails to start or stops with an error.
pub fn run() -> tauri::Result<()> {
    tauri::Builder::default()
        .setup(|app| {
            let directory = app.path().app_data_dir().map_err(AppError::DataDirectory)?;
            app.manage(Database::open_in(&directory)?);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::settings::get_settings,
            commands::settings::set_settings,
        ])
        .run(tauri::generate_context!())
}
