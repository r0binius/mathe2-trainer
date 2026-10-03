//! Counting how shortcuts are used.

use std::sync::Arc;

use tauri::State;

use crate::error::AppError;
use crate::services::database::Database;
use crate::services::usage::{self, MenuUse};

/// Counts one use of a shortcut chosen from a menu, unless learning from work is off.
///
/// # Errors
///
/// Returns a database error if it can't be counted.
#[tauri::command]
pub async fn record_menu_use(
    database: State<'_, Arc<Database>>,
    menu_use: MenuUse,
) -> Result<(), AppError> {
    database
        .run(move |connection| usage::record_menu_use(connection, &menu_use))
        .await
}
