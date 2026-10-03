//! Counting how shortcuts are used.

use std::sync::Arc;

use tauri::State;

use crate::error::AppError;
use crate::services::database::Database;
use crate::services::usage::{self, ShortcutUse, UsageCount};
use crate::services::values::{LayoutId, LocalDay};

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

/// Returns the counts on one layout from the local day `since` on, oldest day first.
///
/// # Errors
///
/// Returns a database error if they can't be read.
#[tauri::command]
pub async fn load_usage(
    database: State<'_, Arc<Database>>,
    layout: LayoutId,
    since: LocalDay,
) -> Result<Vec<UsageCount>, AppError> {
    database
        .run(move |connection| usage::counts(connection, &layout, since))
        .await
}
