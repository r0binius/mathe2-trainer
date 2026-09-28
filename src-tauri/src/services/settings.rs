//! The user's settings: their shape, their defaults and how they're stored.
//!
//! Only settings that differ from their defaults are stored, one row each, so a default that
//! changes in a later version reaches everyone who never changed that setting.

use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use crate::error::AppError;

/// How the popover is opened.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase", deny_unknown_fields)]
pub enum Trigger {
    /// Holding ⌘ on its own for a moment.
    HoldCommand,
    /// A global shortcut.
    Shortcut {
        /// The keys, named as in the frontend's `KeyCombination`.
        keys: Vec<String>,
    },
}

/// Everything the user can set, in the shape the frontend sends and receives.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Settings {
    /// How the popover is opened.
    pub trigger: Trigger,
    /// Whether the app has an icon in the menu bar.
    pub show_menu_bar_icon: bool,
    /// Whether the app has an icon in the Dock.
    pub show_dock_icon: bool,
    /// Whether the app starts when the user logs in.
    pub launch_at_login: bool,
}

/// The old app's defaults.
impl Default for Settings {
    fn default() -> Self {
        Self {
            trigger: Trigger::HoldCommand,
            show_menu_bar_icon: true,
            show_dock_icon: true,
            launch_at_login: true,
        }
    }
}

/// Reads the settings: the defaults, with every stored value that still fits its setting in place
/// of its default.
///
/// # Errors
///
/// Returns a database error if the settings can't be read.
pub fn load(connection: &Connection) -> Result<Settings, AppError> {
    let mut statement = connection.prepare("SELECT key, value FROM settings")?;
    let stored = statement
        .query_map((), |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(stored
        .iter()
        .fold(Settings::default(), |settings, (key, value)| {
            with_stored(&settings, key, value).unwrap_or(settings)
        }))
}

/// Stores the settings that differ from their defaults, replacing what was stored.
///
/// # Errors
///
/// Returns a database error if the settings can't be written. Nothing is changed then.
pub fn save(connection: &mut Connection, settings: &Settings) -> Result<(), AppError> {
    let defaults = fields(&Settings::default())?;
    let transaction = connection.transaction()?;

    transaction.execute("DELETE FROM settings", ())?;
    for (key, value) in fields(settings)? {
        if defaults.get(&key) != Some(&value) {
            transaction.execute(
                "INSERT INTO settings (key, value) VALUES (?1, ?2)",
                (key, value.to_string()),
            )?;
        }
    }
    Ok(transaction.commit()?)
}

/// `settings` with one stored value in place, or `None` if the key is no longer a setting or the
/// value no longer fits it, so the setting keeps its default.
fn with_stored(settings: &Settings, key: &str, value: &str) -> Option<Settings> {
    let mut fields = fields(settings).ok()?;
    *fields.get_mut(key)? = serde_json::from_str(value).ok()?;
    serde_json::from_value(Value::Object(fields)).ok()
}

/// The settings as JSON values by name, as they're stored.
fn fields(settings: &Settings) -> rusqlite::Result<Map<String, Value>> {
    // Can't fail for a struct of plain values, but serde's signature doesn't know that.
    serde_json::to_value(settings)
        .and_then(serde_json::from_value)
        .map_err(|error| rusqlite::Error::ToSqlConversionFailure(error.into()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::database::Database;
    use serde_json::json;

    fn changed() -> Settings {
        Settings {
            trigger: Trigger::Shortcut {
                keys: vec!["Meta".to_owned(), "Shift".to_owned(), "m".to_owned()],
            },
            show_dock_icon: false,
            ..Settings::default()
        }
    }

    fn stored(database: &Database) -> Result<Vec<(String, String)>, AppError> {
        database.with(|connection| {
            let mut statement =
                connection.prepare("SELECT key, value FROM settings ORDER BY key")?;
            let rows = statement
                .query_map((), |row| Ok((row.get(0)?, row.get(1)?)))?
                .collect::<Result<_, _>>()?;
            Ok(rows)
        })
    }

    fn insert(database: &Database, key: &str, value: &str) -> Result<(), AppError> {
        database.with(|connection| {
            connection.execute(
                "INSERT INTO settings (key, value) VALUES (?1, ?2)",
                (key, value),
            )?;
            Ok(())
        })
    }

    #[test]
    fn reaches_the_frontend_in_camel_case() {
        assert_eq!(
            serde_json::to_value(changed()).ok(),
            Some(json!({
                "trigger": { "kind": "shortcut", "keys": ["Meta", "Shift", "m"] },
                "showMenuBarIcon": true,
                "showDockIcon": false,
                "launchAtLogin": true,
            })),
        );
        assert_eq!(
            serde_json::to_value(Trigger::HoldCommand).ok(),
            Some(json!({ "kind": "holdCommand" })),
        );
    }

    #[test]
    fn rejects_unknown_fields_from_the_frontend() {
        let sent = json!({
            "trigger": { "kind": "holdCommand" },
            "showMenuBarIcon": true,
            "showDockIcon": true,
            "launchAtLogin": true,
            "showDockIcons": false,
        });

        assert!(serde_json::from_value::<Settings>(sent).is_err());
    }

    #[test]
    fn starts_with_the_defaults() -> Result<(), AppError> {
        let database = Database::in_memory()?;

        assert_eq!(
            database.with(|connection| load(connection))?,
            Settings::default()
        );
        Ok(())
    }

    #[test]
    fn loads_what_was_saved() -> Result<(), AppError> {
        let database = Database::in_memory()?;

        database.with(|connection| save(connection, &changed()))?;

        assert_eq!(database.with(|connection| load(connection))?, changed());
        Ok(())
    }

    #[test]
    fn stores_only_what_differs_from_the_defaults() -> Result<(), AppError> {
        let database = Database::in_memory()?;

        database.with(|connection| save(connection, &changed()))?;

        assert_eq!(
            stored(&database)?,
            [
                ("showDockIcon".to_owned(), "false".to_owned()),
                (
                    "trigger".to_owned(),
                    r#"{"keys":["Meta","Shift","m"],"kind":"shortcut"}"#.to_owned(),
                ),
            ],
        );
        Ok(())
    }

    #[test]
    fn forgets_a_setting_changed_back_to_its_default() -> Result<(), AppError> {
        let database = Database::in_memory()?;

        database.with(|connection| save(connection, &changed()))?;
        database.with(|connection| save(connection, &Settings::default()))?;

        assert_eq!(stored(&database)?, []);
        Ok(())
    }

    #[test]
    fn keeps_the_default_where_a_stored_value_no_longer_fits() -> Result<(), AppError> {
        let database = Database::in_memory()?;

        insert(&database, "showDockIcon", r#""no""#)?;
        insert(&database, "trigger", r#"{"kind":"doubleTap"}"#)?;
        insert(&database, "showDockIcons", "false")?;
        insert(&database, "launchAtLogin", "false")?;

        assert_eq!(
            database.with(|connection| load(connection))?,
            Settings {
                launch_at_login: false,
                ..Settings::default()
            },
        );
        Ok(())
    }
}
