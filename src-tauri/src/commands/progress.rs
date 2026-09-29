//! Reading and changing learning progress and the review log.

use std::sync::Arc;

use tauri::State;

use crate::error::AppError;
use crate::services::database::Database;
use crate::services::progress::{self, Card, Review, SetRecord, StoredProgress};

/// Returns all set records and cards, on every layout.
///
/// # Errors
///
/// Returns a database error if they can't be read.
#[tauri::command]
pub async fn load_progress(database: State<'_, Arc<Database>>) -> Result<StoredProgress, AppError> {
    database
        .run(move |connection| progress::load(connection))
        .await
}

/// Stores a set's progress on one layout.
///
/// # Errors
///
/// Returns a database error if it can't be written.
#[tauri::command]
pub async fn save_set_progress(
    database: State<'_, Arc<Database>>,
    record: SetRecord,
) -> Result<(), AppError> {
    database
        .run(move |connection| progress::save_set(connection, &record))
        .await
}

/// Logs a review and stores the card it produced, if any.
///
/// # Errors
///
/// Returns a database error if they can't be written.
#[tauri::command]
pub async fn record_review(
    database: State<'_, Arc<Database>>,
    review: Review,
    card: Option<Card>,
) -> Result<(), AppError> {
    database
        .run(move |connection| progress::record_review(connection, &review, card.as_ref()))
        .await
}

/// Replaces all set records and cards with reconciled ones.
///
/// # Errors
///
/// Returns a database error if they can't be written.
#[tauri::command]
pub async fn replace_progress(
    database: State<'_, Arc<Database>>,
    progress: StoredProgress,
) -> Result<(), AppError> {
    database
        .run(move |connection| progress::replace(connection, &progress))
        .await
}

/// Deletes all progress and the review log.
///
/// # Errors
///
/// Returns a database error if it can't be deleted.
#[tauri::command]
pub async fn reset_progress(database: State<'_, Arc<Database>>) -> Result<(), AppError> {
    database.run(progress::reset).await
}
