//! Counting how shortcuts are used.

use std::sync::Arc;

use tauri::State;

use crate::error::AppError;
use crate::services::database::Database;
use crate::services::usage::{self, ShortcutUse};

/// Counts one use of a shortcut, by its keys or from a menu, unless learning from work is off.
///
/// # Errors
///
/// Returns a database error if it can't be counted.
#[tauri::command]
pub async fn record_use(
    database: State<'_, Arc<Database>>,
    shortcut_use: ShortcutUse,
) -> Result<(), AppError> {
    database
        .run(move |connection| usage::record_use(connection, &shortcut_use))
        .await
}
