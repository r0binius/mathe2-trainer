//! Learning progress, review cards and the review log, and how they're stored.
//!
//! The types mirror the frontend's domain types. Rust stores them as they come; checks such as
//! the valid ranges of a card's memory belong to the frontend's decoders.

use rusqlite::{Connection, Row, ToSql};
use serde::{Deserialize, Serialize};

use crate::error::AppError;
use crate::services::database::{Json, query_all};

/// Which shortcuts of a set are learned on one keyboard layout.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SetRecord {
    /// The app the set belongs to.
    pub app_id: String,
    /// The set, unique within its app.
    pub set_id: String,
    /// The keyboard layout's input source ID.
    pub layout: String,
    /// The progress itself.
    pub progress: SetProgress,
}

/// A set's learning progress, as the frontend's `SetProgress`.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SetProgress {
    /// The learned shortcut IDs.
    pub learned: Vec<String>,
    /// When the set was last completed. Left out, not `null`, when it never was, as the
    /// frontend's optional property.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<i64>,
    /// When the progress last changed.
    pub updated_at: i64,
}

/// A recalled shortcut's review card on one keyboard layout, as the frontend's `Card`.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Card {
    /// The shortcut's ID.
    pub id: String,
    /// The keyboard layout's input source ID.
    pub layout: String,
    /// Days until the chance of recalling it drops to 90 %.
    pub stability: f64,
    /// 1–10, how hard it is to raise the stability.
    pub difficulty: f64,
    /// When it was last reviewed.
    pub last_review_at: i64,
    /// When it's due next.
    pub due_at: i64,
    /// How often it was reviewed.
    pub reps: u32,
    /// How often it was forgotten after it was first recalled.
    pub lapses: u32,
}

/// How well a shortcut was recalled, on FSRS's scale.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Grade {
    /// Forgotten.
    Again,
    /// Recalled slowly.
    Hard,
    /// Recalled.
    Good,
    /// Recalled quickly.
    Easy,
}

/// A graded test of a shortcut and what was measured, one entry of the review log. It only comes
/// from the frontend, so it's never serialized.
#[derive(Clone, Debug, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Review {
    /// The shortcut's ID.
    pub id: String,
    /// The keyboard layout's input source ID.
    pub layout: String,
    /// The grade the measurements gave.
    pub grade: Grade,
    /// When the test was answered.
    pub at: i64,
    /// The local UTC offset at that moment, in minutes east of UTC.
    pub utc_offset_minutes: i32,
    /// Whether wrong keys were pressed first.
    pub failed: bool,
    /// Time from showing the shortcut to the correct answer.
    pub duration_ms: u32,
}

/// All stored progress that depends on which shortcuts exist, as the frontend's
/// `StoredProgress`.
#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StoredProgress {
    /// Every set's progress, on every layout.
    pub sets: Vec<SetRecord>,
    /// Every card, on every layout.
    pub cards: Vec<Card>,
}

impl Grade {
    /// The grade as it's stored, the same word the frontend uses.
    fn as_str(self) -> &'static str {
        match self {
            Self::Again => "again",
            Self::Hard => "hard",
            Self::Good => "good",
            Self::Easy => "easy",
        }
    }
}

impl ToSql for Grade {
    fn to_sql(&self) -> rusqlite::Result<rusqlite::types::ToSqlOutput<'_>> {
        self.as_str().to_sql()
    }
}

const SELECT_SETS: &str = "
    SELECT app_id, set_id, layout, learned, completed_at, updated_at FROM set_progress
    ORDER BY app_id, set_id, layout";

const SELECT_CARDS: &str = "
    SELECT shortcut_id, layout, stability, difficulty, last_review_at, due_at, reps, lapses
    FROM cards ORDER BY shortcut_id, layout";

/// Reads all set records and cards, on every layout.
///
/// # Errors
///
/// Returns a database error if they can't be read.
pub fn load(connection: &Connection) -> Result<StoredProgress, AppError> {
    let sets = query_all(connection, SELECT_SETS, read_set_record)?;
    let cards = query_all(connection, SELECT_CARDS, read_card)?;

    Ok(StoredProgress { sets, cards })
}

/// Stores a set's progress, replacing what was stored for that set and layout.
///
/// # Errors
///
/// Returns a database error if it can't be written.
pub fn save_set(connection: &Connection, record: &SetRecord) -> Result<(), AppError> {
    connection.execute(
        "INSERT OR REPLACE INTO set_progress
            (app_id, set_id, layout, learned, completed_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        (
            &record.app_id,
            &record.set_id,
            &record.layout,
            Json(&record.progress.learned),
            record.progress.completed_at,
            record.progress.updated_at,
        ),
    )?;
    Ok(())
}

/// Adds a review to the log and stores the card it produced, together. A failed test of a
/// shortcut that was never recalled produces no card, but is logged all the same.
///
/// # Errors
///
/// Returns a database error if either can't be written. Nothing is changed then.
pub fn record_review(
    connection: &mut Connection,
    review: &Review,
    card: Option<&Card>,
) -> Result<(), AppError> {
    let transaction = connection.transaction()?;

    transaction.execute(
        "INSERT INTO reviews
            (shortcut_id, layout, reviewed_at, utc_offset_minutes, grade, failed, duration_ms)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        (
            &review.id,
            &review.layout,
            review.at,
            review.utc_offset_minutes,
            review.grade,
            review.failed,
            review.duration_ms,
        ),
    )?;
    if let Some(card) = card {
        insert_card(&transaction, card)?;
    }
    Ok(transaction.commit()?)
}

/// Replaces all set records and cards, such as with what reconciling left. The review log is
/// history and stays.
///
/// # Errors
///
/// Returns a database error if they can't be written. Nothing is changed then.
pub fn replace(connection: &mut Connection, progress: &StoredProgress) -> Result<(), AppError> {
    let transaction = connection.transaction()?;

    delete_sets_and_cards(&transaction)?;
    for record in &progress.sets {
        save_set(&transaction, record)?;
    }
    for card in &progress.cards {
        insert_card(&transaction, card)?;
    }
    Ok(transaction.commit()?)
}

/// Deletes all progress: set records, cards and the review log, on every layout.
///
/// # Errors
///
/// Returns a database error if it can't be deleted. Nothing is changed then.
pub fn reset(connection: &mut Connection) -> Result<(), AppError> {
    let transaction = connection.transaction()?;

    delete_sets_and_cards(&transaction)?;
    transaction.execute("DELETE FROM reviews", ())?;
    Ok(transaction.commit()?)
}

fn delete_sets_and_cards(connection: &Connection) -> rusqlite::Result<()> {
    connection.execute("DELETE FROM set_progress", ())?;
    connection.execute("DELETE FROM cards", ())?;
    Ok(())
}

fn insert_card(connection: &Connection, card: &Card) -> rusqlite::Result<()> {
    connection.execute(
        "INSERT OR REPLACE INTO cards
            (shortcut_id, layout, stability, difficulty, last_review_at, due_at, reps, lapses)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        (
            &card.id,
            &card.layout,
            card.stability,
            card.difficulty,
            card.last_review_at,
            card.due_at,
            card.reps,
            card.lapses,
        ),
    )?;
    Ok(())
}

fn read_set_record(row: &Row<'_>) -> rusqlite::Result<SetRecord> {
    let Json(learned) = row.get("learned")?;
    let progress = SetProgress {
        learned,
        completed_at: row.get("completed_at")?,
        updated_at: row.get("updated_at")?,
    };

    Ok(SetRecord {
        app_id: row.get("app_id")?,
        set_id: row.get("set_id")?,
        layout: row.get("layout")?,
        progress,
    })
}

fn read_card(row: &Row<'_>) -> rusqlite::Result<Card> {
    Ok(Card {
        id: row.get("shortcut_id")?,
        layout: row.get("layout")?,
        stability: row.get("stability")?,
        difficulty: row.get("difficulty")?,
        last_review_at: row.get("last_review_at")?,
        due_at: row.get("due_at")?,
        reps: row.get("reps")?,
        lapses: row.get("lapses")?,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::database::Database;
    use serde_json::json;

    const GERMAN: &str = "com.apple.keylayout.German";
    const US: &str = "com.apple.keylayout.US";

    fn record(layout: &str, learned: &[&str], completed_at: Option<i64>) -> SetRecord {
        SetRecord {
            app_id: "macos".to_owned(),
            set_id: "windows".to_owned(),
            layout: layout.to_owned(),
            progress: SetProgress {
                learned: learned.iter().map(|&id| id.to_owned()).collect(),
                completed_at,
                updated_at: 1_000,
            },
        }
    }

    fn card(layout: &str, reps: u32) -> Card {
        Card {
            id: "macos:cmd+m".to_owned(),
            layout: layout.to_owned(),
            stability: 3.17,
            difficulty: 5.3,
            last_review_at: 1_000,
            due_at: 2_000,
            reps,
            lapses: 0,
        }
    }

    fn review(grade: Grade) -> Review {
        Review {
            id: "macos:cmd+m".to_owned(),
            layout: GERMAN.to_owned(),
            grade,
            at: 1_000,
            utc_offset_minutes: 120,
            failed: grade == Grade::Again,
            duration_ms: 1_500,
        }
    }

    /// A review log row: shortcut, layout, time, UTC offset, grade, failed and duration.
    type LoggedReview = (String, String, i64, i32, String, bool, u32);

    const SELECT_LOG: &str = "
        SELECT shortcut_id, layout, reviewed_at, utc_offset_minutes, grade, failed, duration_ms
        FROM reviews ORDER BY id";

    /// The row [`review`] logs with the given grade.
    fn logged_as(grade: &str) -> LoggedReview {
        let (id, layout) = ("macos:cmd+m".to_owned(), GERMAN.to_owned());

        (id, layout, 1_000, 120, grade.to_owned(), false, 1_500)
    }

    fn logged_review(row: &Row<'_>) -> rusqlite::Result<LoggedReview> {
        let (id, layout, at, offset) = (row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?);

        Ok((
            id,
            layout,
            at,
            offset,
            row.get(4)?,
            row.get(5)?,
            row.get(6)?,
        ))
    }

    fn logged(database: &Database) -> Result<Vec<LoggedReview>, AppError> {
        database.with(|connection| Ok(query_all(connection, SELECT_LOG, logged_review)?))
    }

    fn loaded(database: &Database) -> Result<StoredProgress, AppError> {
        database.with(|connection| load(connection))
    }

    fn saved(database: &Database, record: &SetRecord) -> Result<(), AppError> {
        database.with(|connection| save_set(connection, record))
    }

    fn reviewed(database: &Database, review: &Review, card: Option<&Card>) -> Result<(), AppError> {
        database.with(|connection| record_review(connection, review, card))
    }

    #[test]
    fn matches_the_frontend_types() {
        let set_json = json!({
            "appId": "macos",
            "setId": "windows",
            "layout": GERMAN,
            "progress": { "learned": ["macos:cmd+m"], "updatedAt": 1_000 },
        });
        let card_json = json!({
            "id": "macos:cmd+m",
            "layout": GERMAN,
            "stability": 3.17,
            "difficulty": 5.3,
            "lastReviewAt": 1_000,
            "dueAt": 2_000,
            "reps": 2,
            "lapses": 0,
        });
        let review_json = json!({
            "id": "macos:cmd+m",
            "layout": GERMAN,
            "grade": "hard",
            "at": 1_000,
            "utcOffsetMinutes": 120,
            "failed": false,
            "durationMs": 1_500,
        });

        let set = serde_json::to_value(record(GERMAN, &["macos:cmd+m"], None)).ok();
        let card = serde_json::to_value(card(GERMAN, 2)).ok();
        let review_sent = serde_json::from_value::<Review>(review_json).ok();

        assert_eq!(set, Some(set_json));
        assert_eq!(card, Some(card_json));
        assert_eq!(review_sent, Some(review(Grade::Hard)));
    }

    #[test]
    fn rejects_what_the_frontend_types_rule_out() {
        let with_unknown_field = json!({
            "appId": "macos",
            "setId": "windows",
            "layout": GERMAN,
            "progress": { "learned": [], "updatedAt": 1_000, "runs": [] },
        });
        let with_fractional_time = json!({ "sets": [], "cards": [{
            "id": "macos:cmd+m", "layout": GERMAN, "stability": 3.17, "difficulty": 5.3,
            "lastReviewAt": 1_000.5, "dueAt": 2_000, "reps": 2, "lapses": 0,
        }]});

        assert!(serde_json::from_value::<SetRecord>(with_unknown_field).is_err());
        assert!(serde_json::from_value::<StoredProgress>(with_fractional_time).is_err());
    }

    #[test]
    fn starts_empty() -> Result<(), AppError> {
        assert_eq!(loaded(&Database::in_memory()?)?, StoredProgress::default());
        Ok(())
    }

    #[test]
    fn keeps_one_record_per_set_and_layout() -> Result<(), AppError> {
        let database = Database::in_memory()?;
        let german = record(GERMAN, &["macos:cmd+m", "macos:cmd+w"], Some(900));
        let us = record(US, &[], None);

        saved(&database, &record(GERMAN, &["macos:cmd+m"], None))?;
        saved(&database, &german)?;
        saved(&database, &us)?;

        assert_eq!(loaded(&database)?.sets, [german, us]);
        Ok(())
    }

    #[test]
    fn logs_a_review_with_the_card_it_produced() -> Result<(), AppError> {
        let database = Database::in_memory()?;

        reviewed(&database, &review(Grade::Good), Some(&card(GERMAN, 1)))?;
        reviewed(&database, &review(Grade::Easy), Some(&card(GERMAN, 2)))?;

        assert_eq!(loaded(&database)?.cards, [card(GERMAN, 2)]);
        assert_eq!(logged(&database)?, [logged_as("good"), logged_as("easy")]);
        Ok(())
    }

    #[test]
    fn logs_a_failed_first_test_without_a_card() -> Result<(), AppError> {
        let database = Database::in_memory()?;

        reviewed(&database, &review(Grade::Again), None)?;

        assert_eq!(loaded(&database)?.cards, []);
        assert_eq!(logged(&database)?.len(), 1);
        Ok(())
    }

    #[test]
    fn keeps_cards_per_layout() -> Result<(), AppError> {
        let database = Database::in_memory()?;

        reviewed(&database, &review(Grade::Good), Some(&card(GERMAN, 1)))?;
        reviewed(&database, &review(Grade::Good), Some(&card(US, 1)))?;

        assert_eq!(loaded(&database)?.cards, [card(GERMAN, 1), card(US, 1)]);
        Ok(())
    }

    #[test]
    fn replacing_keeps_the_review_log() -> Result<(), AppError> {
        let database = Database::in_memory()?;
        let reconciled = StoredProgress {
            sets: vec![record(US, &[], None)],
            cards: vec![card(US, 1)],
        };

        saved(&database, &record(GERMAN, &[], None))?;
        reviewed(&database, &review(Grade::Good), Some(&card(GERMAN, 1)))?;
        database.with(|connection| replace(connection, &reconciled))?;

        assert_eq!(loaded(&database)?, reconciled);
        assert_eq!(logged(&database)?.len(), 1);
        Ok(())
    }

    #[test]
    fn reset_deletes_everything() -> Result<(), AppError> {
        let database = Database::in_memory()?;

        saved(&database, &record(GERMAN, &[], None))?;
        reviewed(&database, &review(Grade::Good), Some(&card(GERMAN, 1)))?;
        database.with(reset)?;

        assert_eq!(loaded(&database)?, StoredProgress::default());
        assert_eq!(logged(&database)?, []);
        Ok(())
    }

    #[test]
    fn the_schema_rejects_learned_ids_that_are_no_list() -> Result<(), AppError> {
        let database = Database::in_memory()?;
        let not_a_list = "
            INSERT INTO set_progress (app_id, set_id, layout, learned, updated_at)
            VALUES ('macos', 'windows', 'German', '{}', 1000)";

        let inserted = database.with(|connection| Ok(connection.execute(not_a_list, ())))?;

        assert!(inserted.is_err());
        Ok(())
    }
}
