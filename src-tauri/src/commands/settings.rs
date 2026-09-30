//! Reading and changing the settings.

use std::sync::Arc;

use tauri::{AppHandle, State};
use tauri_plugin_log::log;

use crate::app;
use crate::error::AppError;
use crate::services::database::Database;
use crate::services::settings::{self, Settings};

/// Returns the current settings.
///
/// # Errors
///
/// Returns a database error if the settings can't be read.
#[tauri::command]
pub async fn get_settings(database: State<'_, Arc<Database>>) -> Result<Settings, AppError> {
    database
        .run(move |connection| settings::load(connection))
        .await
}

/// Replaces the settings, and applies the trigger. A trigger that can't be set up is logged: the
/// settings are saved all the same.
///
/// # Errors
///
/// Returns a database error if the settings can't be written.
#[tauri::command]
pub async fn set_settings(
    app: AppHandle,
    database: State<'_, Arc<Database>>,
    settings: Settings,
) -> Result<(), AppError> {
    let trigger = settings.trigger.clone();

    database
        .run(move |connection| settings::save(connection, &settings))
        .await?;
    // Watching the keyboard and reading the layout only work on the main thread.
    let handle = app.clone();
    if let Err(error) = app.run_on_main_thread(move || app::apply_trigger(&handle, trigger)) {
        log::error!("cannot apply the trigger: {error}");
    }
    Ok(())
}
