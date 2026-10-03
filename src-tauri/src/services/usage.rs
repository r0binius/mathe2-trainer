//! How often shortcuts are used, counted per day while "Learn from how I work" is on.

use rusqlite::{Connection, named_params};
use serde::Deserialize;

use crate::error::AppError;
use crate::services::settings;
use crate::services::values::{LayoutId, LocalDay, ShortcutId};

/// How a shortcut was used.
#[derive(Copy, Clone, Debug, Eq, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum UsedBy {
    /// Its keys were pressed in its app.
    Keys,
    /// It was chosen from its app's menu.
    Menu,
}

/// A use of a shortcut, as the frontend sends it once it matched it.
#[derive(Clone, Debug, Eq, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ShortcutUse {
    /// The shortcut used.
    pub id: ShortcutId,
    /// The keyboard layout it was matched on.
    pub layout: LayoutId,
    /// The local day it was used on.
    pub day: LocalDay,
    /// Whether by its keys or from a menu.
    pub by: UsedBy,
}

/// Counts one use of a shortcut, unless learning from work is off by now: a use that arrives just
/// after the switch turned off isn't kept.
///
/// # Errors
///
/// Returns a database error if the settings can't be read or the count can't be written.
pub fn record_use(connection: &Connection, shortcut_use: &ShortcutUse) -> Result<(), AppError> {
    if !settings::load(connection)?.learn_from_work {
        return Ok(());
    }

    // Every field is named, so a new one fails to compile until it's counted too.
    let ShortcutUse {
        id,
        layout,
        day,
        by,
    } = shortcut_use;
    let sql = match by {
        UsedBy::Keys => {
            "INSERT INTO usage (shortcut_id, layout, day, by_keys) VALUES (:id, :layout, :day, 1)
             ON CONFLICT (shortcut_id, layout, day) DO UPDATE SET by_keys = by_keys + 1"
        }
        UsedBy::Menu => {
            "INSERT INTO usage (shortcut_id, layout, day, by_menu) VALUES (:id, :layout, :day, 1)
             ON CONFLICT (shortcut_id, layout, day) DO UPDATE SET by_menu = by_menu + 1"
        }
    };

    connection.execute(
        sql,
        named_params! { ":id": id, ":layout": layout, ":day": day },
    )?;
    Ok(())
}

/// Deletes every count, as turning the switch off or resetting progress does.
///
/// # Errors
///
/// Returns the database's error if the counts can't be deleted.
pub fn forget(connection: &Connection) -> rusqlite::Result<()> {
    connection.execute("DELETE FROM usage", ())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;
    use crate::services::database::{Database, query_all};
    use crate::services::settings::Settings;

    /// A use of ⌘M on the German layout on `day`, `by` keys or menu.
    fn used(day: i64, by: &str) -> ShortcutUse {
        serde_json::from_value(json!({
            "id": "macos/Meta+m",
            "layout": "com.apple.keylayout.German",
            "day": day,
            "by": by,
        }))
        .expect("the use deserializes")
    }

    fn learning(database: &Database, on: bool) {
        let settings = Settings {
            learn_from_work: on,
            ..Settings::default()
        };

        database
            .with(|connection| settings::save(connection, &settings))
            .expect("the settings are saved");
    }

    fn record(database: &Database, shortcut_use: &ShortcutUse) {
        database
            .with(|connection| record_use(connection, shortcut_use))
            .expect("the use is recorded");
    }

    /// A count by day: the day, by keys and by menu.
    type Count = (i64, i64, i64);

    fn count_of(row: &rusqlite::Row<'_>) -> rusqlite::Result<Count> {
        Ok((row.get(0)?, row.get(1)?, row.get(2)?))
    }

    fn counts(database: &Database) -> Vec<Count> {
        let sql = "SELECT day, by_keys, by_menu FROM usage ORDER BY day";

        database
            .with(|connection| Ok(query_all(connection, sql, (), count_of)?))
            .expect("the counts are read")
    }

    #[test]
    fn counts_each_use_per_day_by_keys_and_from_menus() {
        let database = Database::in_memory();

        learning(&database, true);
        record(&database, &used(20_000, "menu"));
        record(&database, &used(20_000, "keys"));
        record(&database, &used(20_000, "keys"));
        record(&database, &used(20_001, "menu"));

        assert_eq!(counts(&database), [(20_000, 2, 1), (20_001, 0, 1)]);
    }

    #[test]
    fn counts_nothing_while_learning_from_work_is_off() {
        let database = Database::in_memory();

        record(&database, &used(20_000, "keys"));

        assert_eq!(counts(&database), []);
    }

    #[test]
    fn rejects_a_use_from_before_1970_or_of_another_kind() {
        let before = json!({
            "id": "macos/Meta+m", "layout": "com.apple.keylayout.German", "day": -1, "by": "keys",
        });
        let spoken = json!({
            "id": "macos/Meta+m", "layout": "com.apple.keylayout.German", "day": 1, "by": "voice",
        });

        assert!(serde_json::from_value::<ShortcutUse>(before).is_err());
        assert!(serde_json::from_value::<ShortcutUse>(spoken).is_err());
    }
}
