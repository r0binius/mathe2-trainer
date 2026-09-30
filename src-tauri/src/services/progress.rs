//! Learning progress, review cards and the review log, and how they're stored.
//!
//! The types mirror the frontend's domain types. What the webview sends is checked as it's
//! deserialized, with the frontend decoders' rules: IDs and times by their types
//! ([`values`](crate::services::values)), a card's memory by [`Card`]'s own rules.

use rusqlite::{Connection, Row, ToSql, named_params};
use serde::{Deserialize, Serialize};

use crate::error::AppError;
use crate::services::database::{Json, query_all};
use crate::services::values::{EpochMillis, InvalidValue, LayoutId, ShortcutId};

/// The stability range FSRS works in, in days, as the frontend's scheduler checks it.
const STABILITY: std::ops::RangeInclusive<f64> = 0.001..=36_500.0;

/// The difficulty range FSRS works in, as the frontend's scheduler checks it.
const DIFFICULTY: std::ops::RangeInclusive<f64> = 1.0..=10.0;

/// Which shortcuts of a set are learned on one keyboard layout.
#[derive(Clone, Debug, Eq, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SetRecord {
    /// The app the set belongs to.
    pub app_id: String,
    /// The set, unique within its app.
    pub set_id: String,
    /// The keyboard layout's input source ID.
    pub layout: LayoutId,
    /// The progress itself.
    pub progress: SetProgress,
}

/// A set's learning progress, as the frontend's `SetProgress`.
#[derive(Clone, Debug, Eq, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SetProgress {
    /// The learned shortcut IDs.
    pub learned: Vec<ShortcutId>,
    /// The trained shortcut IDs: pressed right with their keys shown, not yet recalled.
    pub trained: Vec<ShortcutId>,
    /// When the set was last completed. Left out, not `null`, when it never was, as the
    /// frontend's optional property.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<EpochMillis>,
    /// When the progress last changed.
    pub updated_at: EpochMillis,
}

/// A recalled shortcut's review card on one keyboard layout, as the frontend's `Card`.
///
/// Deserializing one checks its memory as the frontend's `parseCardMemory` does (see
/// [`Card::try_from`]).
#[derive(Clone, Debug, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", try_from = "CardFields")]
pub struct Card {
    /// The shortcut's ID.
    pub id: ShortcutId,
    /// The keyboard layout's input source ID.
    pub layout: LayoutId,
    /// Days until the chance of recalling it drops to 90 %, within [`STABILITY`].
    pub stability: f64,
    /// How hard it is to raise the stability, within [`DIFFICULTY`].
    pub difficulty: f64,
    /// When it was last reviewed.
    pub last_review_at: EpochMillis,
    /// When it's due next, not before it was last reviewed.
    pub due_at: EpochMillis,
    /// How often it was reviewed, at least once.
    pub reps: u32,
    /// How often it was forgotten after it was first recalled, fewer than `reps`: the first
    /// review can't be a lapse.
    pub lapses: u32,
}

impl TryFrom<CardFields> for Card {
    type Error = InvalidValue;

    /// Checks a card's memory with the frontend's rules: stability and difficulty within FSRS's
    /// ranges, fewer lapses than reviews, and not due before its last review.
    fn try_from(fields: CardFields) -> Result<Self, Self::Error> {
        let CardFields {
            id,
            layout,
            stability,
            difficulty,
            last_review_at,
            due_at,
            reps,
            lapses,
        } = fields;
        let reason = if !STABILITY.contains(&stability) {
            Some("stability out of range")
        } else if !DIFFICULTY.contains(&difficulty) {
            Some("difficulty out of range")
        } else if lapses >= reps {
            Some("not fewer lapses than reviews")
        } else if due_at < last_review_at {
            Some("due before its last review")
        } else {
            None
        };

        match reason {
            Some(reason) => Err(InvalidValue::new("card", reason)),
            None => Ok(Self {
                id,
                layout,
                stability,
                difficulty,
                last_review_at,
                due_at,
                reps,
                lapses,
            }),
        }
    }
}

/// How well a shortcut was recalled, on FSRS's scale.
#[derive(Copy, Clone, Debug, Eq, PartialEq, Deserialize)]
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

/// A graded test of a shortcut and what was measured, one entry of the review log. It only comes
/// from the frontend, so it's never serialized.
#[derive(Clone, Debug, Eq, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Review {
    /// The shortcut's ID.
    pub id: ShortcutId,
    /// The keyboard layout's input source ID.
    pub layout: LayoutId,
    /// The grade the measurements gave.
    pub grade: Grade,
    /// When the test was answered.
    pub at: EpochMillis,
    /// The local UTC offset at that moment, in minutes east of UTC.
    pub utc_offset_minutes: i32,
    /// Whether wrong keys were pressed first.
    pub failed: bool,
    /// Time from showing the shortcut to the correct answer.
    pub duration_ms: u32,
}

/// All stored progress that depends on which shortcuts exist, as the frontend's
/// `StoredProgress`.
#[derive(Clone, Debug, Default, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct StoredProgress {
    /// Every set's progress, on every layout.
    pub sets: Vec<SetRecord>,
    /// Every card, on every layout.
    pub cards: Vec<Card>,
}

const SELECT_SETS: &str = "
    SELECT app_id, set_id, layout, learned, trained, completed_at, updated_at FROM set_progress
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
    // Every field is named, so a new one fails to compile until it's stored too.
    let SetRecord {
        app_id,
        set_id,
        layout,
        progress,
    } = record;
    let SetProgress {
        learned,
        trained,
        completed_at,
        updated_at,
    } = progress;

    connection.execute(
        "INSERT OR REPLACE INTO set_progress
            (app_id, set_id, layout, learned, trained, completed_at, updated_at)
         VALUES (:app_id, :set_id, :layout, :learned, :trained, :completed_at, :updated_at)",
        named_params! {
            ":app_id": app_id,
            ":set_id": set_id,
            ":layout": layout,
            ":learned": Json(learned),
            ":trained": Json(trained),
            ":completed_at": completed_at,
            ":updated_at": updated_at,
        },
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

    insert_review(&transaction, review)?;
    if let Some(card) = card {
        insert_card(&transaction, card)?;
    }
    transaction.commit()?;
    Ok(())
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
    transaction.commit()?;
    Ok(())
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
    transaction.commit()?;
    Ok(())
}

fn delete_sets_and_cards(connection: &Connection) -> rusqlite::Result<()> {
    connection.execute("DELETE FROM set_progress", ())?;
    connection.execute("DELETE FROM cards", ())?;
    Ok(())
}

fn insert_review(connection: &Connection, review: &Review) -> rusqlite::Result<()> {
    // Every field is named, so a new one fails to compile until it's logged too.
    let Review {
        id,
        layout,
        grade,
        at,
        utc_offset_minutes,
        failed,
        duration_ms,
    } = review;

    connection.execute(
        "INSERT INTO reviews
            (shortcut_id, layout, reviewed_at, utc_offset_minutes, grade, failed, duration_ms)
         VALUES (:id, :layout, :at, :utc_offset_minutes, :grade, :failed, :duration_ms)",
        named_params! {
            ":id": id,
            ":layout": layout,
            ":at": at,
            ":utc_offset_minutes": utc_offset_minutes,
            ":grade": grade,
            ":failed": failed,
            ":duration_ms": duration_ms,
        },
    )?;
    Ok(())
}

fn insert_card(connection: &Connection, card: &Card) -> rusqlite::Result<()> {
    // Every field is named, so a new one fails to compile until it's stored too.
    let Card {
        id,
        layout,
        stability,
        difficulty,
        last_review_at,
        due_at,
        reps,
        lapses,
    } = card;

    connection.execute(
        "INSERT OR REPLACE INTO cards
            (shortcut_id, layout, stability, difficulty, last_review_at, due_at, reps, lapses)
         VALUES (:id, :layout, :stability, :difficulty, :last_review_at, :due_at, :reps, :lapses)",
        named_params! {
            ":id": id,
            ":layout": layout,
            ":stability": stability,
            ":difficulty": difficulty,
            ":last_review_at": last_review_at,
            ":due_at": due_at,
            ":reps": reps,
            ":lapses": lapses,
        },
    )?;
    Ok(())
}

fn read_set_record(row: &Row<'_>) -> rusqlite::Result<SetRecord> {
    let app_id = row.get("app_id")?;
    let set_id = row.get("set_id")?;
    let layout = row.get("layout")?;
    let Json(learned): Json<Vec<String>> = row.get("learned")?;
    let Json(trained): Json<Vec<String>> = row.get("trained")?;
    let completed_at = row.get("completed_at")?;
    let updated_at = row.get("updated_at")?;
    // As stored, without checking again (see `values`).
    let learned = learned.into_iter().map(ShortcutId::stored).collect();
    let trained = trained.into_iter().map(ShortcutId::stored).collect();

    let progress = SetProgress {
        learned,
        trained,
        completed_at,
        updated_at,
    };
    Ok(SetRecord {
        app_id,
        set_id,
        layout,
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

// serde types.

/// A card as the webview sends it, before [`Card::try_from`] checks it.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct CardFields {
    id: ShortcutId,
    layout: LayoutId,
    stability: f64,
    difficulty: f64,
    last_review_at: EpochMillis,
    due_at: EpochMillis,
    reps: u32,
    lapses: u32,
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;
    use crate::services::database::Database;

    const GERMAN: &str = "com.apple.keylayout.German";
    const US: &str = "com.apple.keylayout.US";

    fn shortcut(id: &str) -> ShortcutId {
        ShortcutId::stored(id.to_owned())
    }

    fn layout(id: &str) -> LayoutId {
        LayoutId::stored(id.to_owned())
    }

    fn record(layout_id: &str, learned: &[&str], completed_at: Option<i64>) -> SetRecord {
        SetRecord {
            app_id: "macos".to_owned(),
            set_id: "windows".to_owned(),
            layout: layout(layout_id),
            progress: SetProgress {
                learned: learned.iter().copied().map(shortcut).collect(),
                trained: Vec::new(),
                completed_at: completed_at.map(EpochMillis::stored),
                updated_at: EpochMillis::stored(1_000),
            },
        }
    }

    fn card(layout_id: &str, reps: u32) -> Card {
        Card {
            id: shortcut("macos/Meta+m"),
            layout: layout(layout_id),
            stability: 3.17,
            difficulty: 5.3,
            last_review_at: EpochMillis::stored(1_000),
            due_at: EpochMillis::stored(2_000),
            reps,
            lapses: 0,
        }
    }

    fn review(grade: Grade) -> Review {
        Review {
            id: shortcut("macos/Meta+m"),
            layout: layout(GERMAN),
            grade,
            at: EpochMillis::stored(1_000),
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
        let (id, layout) = ("macos/Meta+m".to_owned(), GERMAN.to_owned());

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
            "progress": { "learned": ["macos/Meta+m"], "trained": [], "updatedAt": 1_000 },
        });
        let card_json = json!({
            "id": "macos/Meta+m",
            "layout": GERMAN,
            "stability": 3.17,
            "difficulty": 5.3,
            "lastReviewAt": 1_000,
            "dueAt": 2_000,
            "reps": 2,
            "lapses": 0,
        });
        let review_json = json!({
            "id": "macos/Meta+m",
            "layout": GERMAN,
            "grade": "hard",
            "at": 1_000,
            "utcOffsetMinutes": 120,
            "failed": false,
            "durationMs": 1_500,
        });

        let set = serde_json::to_value(record(GERMAN, &["macos/Meta+m"], None)).ok();
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
            "progress": { "learned": [], "trained": [], "updatedAt": 1_000, "runs": [] },
        });
        let with_fractional_time = json!({ "sets": [], "cards": [{
            "id": "macos/Meta+m", "layout": GERMAN, "stability": 3.17, "difficulty": 5.3,
            "lastReviewAt": 1_000.5, "dueAt": 2_000, "reps": 2, "lapses": 0,
        }]});

        assert!(serde_json::from_value::<SetRecord>(with_unknown_field).is_err());
        assert!(serde_json::from_value::<StoredProgress>(with_fractional_time).is_err());
    }

    /// A valid card as the webview sends it, with one field changed, deserialized.
    fn sent_card(field: &str, value: serde_json::Value) -> Result<Card, String> {
        let mut card = json!({
            "id": "macos/Meta+m", "layout": GERMAN, "stability": 3.17, "difficulty": 5.3,
            "lastReviewAt": 1_000, "dueAt": 2_000, "reps": 2, "lapses": 1,
        });
        card[field] = value;

        serde_json::from_value(card).map_err(|error| error.to_string())
    }

    #[test]
    fn checks_a_cards_memory_as_the_frontend_does() {
        let rejected = |field, value, reason: &str| {
            sent_card(field, value).is_err_and(|error| error.contains(reason))
        };

        assert!(sent_card("reps", json!(2)).is_ok());
        assert!(rejected("stability", json!(0.0), "stability"));
        assert!(rejected("difficulty", json!(10.5), "difficulty"));
        assert!(rejected("lapses", json!(2), "lapses"));
        assert!(rejected("dueAt", json!(999), "due before"));
        assert!(rejected("id", json!("Meta+m"), "shortcut ID"));
        assert!(rejected("runs", json!([]), "unknown field"));
    }

    #[test]
    fn checks_the_ids_and_times_of_a_review() {
        let review = json!({
            "id": "macos/Meta+m", "layout": "", "grade": "good", "at": -1,
            "utcOffsetMinutes": 120, "failed": false, "durationMs": 1_500,
        });

        assert!(serde_json::from_value::<Review>(review).is_err());
    }

    #[test]
    fn starts_empty() -> Result<(), AppError> {
        assert_eq!(loaded(&Database::in_memory()?)?, StoredProgress::default());
        Ok(())
    }

    #[test]
    fn keeps_one_record_per_set_and_layout() -> Result<(), AppError> {
        let database = Database::in_memory()?;
        let german = record(GERMAN, &["macos/Meta+m", "macos/Meta+w"], Some(900));
        let us = record(US, &[], None);

        saved(&database, &record(GERMAN, &["macos/Meta+m"], None))?;
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
    fn keeps_trained_shortcuts() -> Result<(), AppError> {
        let database = Database::in_memory()?;
        let mut trained = record(GERMAN, &["macos/Meta+m"], None);
        trained.progress.trained = vec![shortcut("macos/Meta+w")];

        saved(&database, &trained)?;

        assert_eq!(loaded(&database)?.sets, [trained]);
        Ok(())
    }

    #[test]
    fn the_schema_rejects_trained_ids_that_are_no_list() -> Result<(), AppError> {
        let database = Database::in_memory()?;
        let not_a_list = "
            INSERT INTO set_progress (app_id, set_id, layout, learned, trained, updated_at)
            VALUES ('macos', 'windows', 'German', '[]', 'x', 1000)";

        let inserted = database.with(|connection| Ok(connection.execute(not_a_list, ())))?;

        assert!(inserted.is_err());
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
