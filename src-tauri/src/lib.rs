//! Mouseless: keyboard shortcut training and look-up.
//!
//! The library builds the Tauri app, and `main.rs` only calls [`run`].

mod commands;
mod error;
mod platform;
mod services;

use std::sync::Arc;

use tauri::Manager;

use crate::error::AppError;
use crate::services::database::Database;

/// The ID of the keyboard layout in use and its keymap as fixture JSON, for the `dump_keymap`
/// example. With `ansi`, keys are translated as on an ANSI keyboard, whatever keyboard is
/// connected.
///
/// # Errors
///
/// Returns an error if the layout can't be read, such as off the main thread.
#[doc(hidden)]
#[cfg(target_os = "macos")]
pub fn dump_keymap(ansi: bool) -> Result<(String, String), Box<dyn std::error::Error>> {
    use crate::platform::macos::{input_source, keymap::Keyboard};

    let layout = input_source::current_layout(ansi.then_some(Keyboard::Ansi))?;

    Ok((layout.id, serde_json::to_string_pretty(&layout.keymap)?))
}

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
            let directory = app.path().app_data_dir().map_err(AppError::DataDirectory)?;
            app.manage(Arc::new(Database::open_in(&directory)?));
            app.manage(platform::current());
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
