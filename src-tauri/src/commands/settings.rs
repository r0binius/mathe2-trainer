//! Reading and changing the settings.

use std::sync::Arc;

use tauri::State;

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

/// Replaces the settings.
///
/// # Errors
///
/// Returns a database error if the settings can't be written.
#[tauri::command]
pub async fn set_settings(
    database: State<'_, Arc<Database>>,
    settings: Settings,
) -> Result<(), AppError> {
    database
        .run(move |connection| settings::save(connection, &settings))
        .await?;
    Ok(())
}
