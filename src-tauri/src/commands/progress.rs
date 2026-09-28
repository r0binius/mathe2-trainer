//! Reading and changing learning progress and the review log.

use tauri::State;

use crate::error::AppError;
use crate::services::database::Database;
use crate::services::progress::{self, Card, Review, SetRecord, StoredProgress};

/// Returns all set records and cards, on every layout.
///
/// # Errors
///
/// Returns a database error if they can't be read.
#[tauri::command(async)]
pub fn load_progress(database: State<'_, Database>) -> Result<StoredProgress, AppError> {
    database.with(|connection| progress::load(connection))
}

/// Stores a set's progress on one layout.
///
/// # Errors
///
/// Returns a database error if it can't be written.
#[tauri::command(async)]
pub fn save_set_progress(database: State<'_, Database>, record: SetRecord) -> Result<(), AppError> {
    database.with(|connection| progress::save_set(connection, &record))
}

/// Logs a review and stores the card it produced, if any.
///
/// # Errors
///
/// Returns a database error if they can't be written.
#[tauri::command(async)]
pub fn record_review(
    database: State<'_, Database>,
    review: Review,
    card: Option<Card>,
) -> Result<(), AppError> {
    database.with(|connection| progress::record_review(connection, &review, card.as_ref()))
}

/// Replaces all set records and cards with reconciled ones.
///
/// # Errors
///
/// Returns a database error if they can't be written.
#[tauri::command(async)]
pub fn replace_progress(
    database: State<'_, Database>,
    progress: StoredProgress,
) -> Result<(), AppError> {
    database.with(|connection| progress::replace(connection, &progress))
}

/// Deletes all progress and the review log.
///
/// # Errors
///
/// Returns a database error if it can't be deleted.
#[tauri::command(async)]
pub fn reset_progress(database: State<'_, Database>) -> Result<(), AppError> {
    database.with(progress::reset)
}
