//! Reading and changing the settings.

use tauri::State;

use crate::error::AppError;
use crate::services::database::Database;
use crate::services::settings::{self, Settings};

// `async` runs a command off the main thread, which would otherwise wait for the database.

/// Returns the current settings.
///
/// # Errors
///
/// Returns a database error if the settings can't be read.
#[tauri::command(async)]
pub fn get_settings(database: State<'_, Database>) -> Result<Settings, AppError> {
    database.with(|connection| settings::load(connection))
}

/// Replaces the settings.
///
/// # Errors
///
/// Returns a database error if the settings can't be written.
#[tauri::command(async)]
pub fn set_settings(database: State<'_, Database>, settings: Settings) -> Result<(), AppError> {
    database.with(|connection| settings::save(connection, &settings))
}
