//! The user's settings: their shape, their defaults and how they're stored.
//!
//! Only settings that differ from their defaults are stored, one row each, so a default that
//! changes in a later version reaches everyone who never changed that setting.

use rusqlite::{Connection, Row};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use crate::error::AppError;
use crate::services::database::query_all;
use crate::services::usage;

/// How the popover is opened.
#[derive(Clone, Debug, Eq, PartialEq, Deserialize, Serialize)]
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

/// The language of the interface.
#[derive(Copy, Clone, Debug, Eq, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Language {
    /// The system's preferred language, if the interface is written in it, else English.
    System,
    /// English.
    En,
    /// German.
    De,
}

/// A language the interface is written in.
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum UiLanguage {
    /// English.
    En,
    /// German.
    De,
}

impl Language {
    /// The language the interface shows for this setting: the chosen one, or the first of the
    /// system's `preferred` languages the interface is written in, else English. Like the
    /// frontend's `uiLanguageFor`, so the menus match the windows.
    #[must_use]
    pub fn in_interface(self, preferred: &[String]) -> UiLanguage {
        match self {
            Self::En => UiLanguage::En,
            Self::De => UiLanguage::De,
            Self::System => preferred
                .iter()
                .find_map(|tag| ui_language_of(tag))
                .unwrap_or(UiLanguage::En),
        }
    }
}

/// The interface language for a BCP 47 tag, by its primary language: `de-AT` is German.
fn ui_language_of(tag: &str) -> Option<UiLanguage> {
    let primary = tag.split('-').next().unwrap_or_default();

    if primary.eq_ignore_ascii_case("en") {
        Some(UiLanguage::En)
    } else if primary.eq_ignore_ascii_case("de") {
        Some(UiLanguage::De)
    } else {
        None
    }
}

/// Everything the user can set, in the shape the frontend sends and receives.
#[derive(Clone, Debug, Eq, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Settings {
    /// How the popover is opened.
    pub trigger: Trigger,
    /// Whether the app has an icon in the menu bar. See [`Settings::shows_menu_bar_icon`].
    pub show_menu_bar_icon: bool,
    /// Whether the app has an icon in the Dock.
    pub show_dock_icon: bool,
    /// The language of the interface.
    pub language: Language,
    /// Whether Mouseless watches menu choices and key presses of known shortcuts, and counts them.
    pub learn_from_work: bool,
}

impl Settings {
    /// Whether the menu bar icon shows: as set, but always without a Dock icon, so the app keeps a
    /// visible way to reach it. The options never hide both; this holds if the settings do anyway.
    #[must_use]
    pub fn shows_menu_bar_icon(&self) -> bool {
        self.show_menu_bar_icon || !self.show_dock_icon
    }
}

/// The old app's defaults.
impl Default for Settings {
    fn default() -> Self {
        Self {
            trigger: Trigger::HoldCommand,
            show_menu_bar_icon: true,
            show_dock_icon: true,
            language: Language::System,
            learn_from_work: false,
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
    let stored = query_all(
        connection,
        "SELECT key, value FROM settings",
        (),
        read_entry,
    )?;

    Ok(stored
        .iter()
        .fold(Settings::default(), |settings, (key, value)| {
            with_stored(&settings, key, value).unwrap_or(settings)
        }))
}

/// Stores the settings that differ from their defaults, replacing what was stored. Without
/// [`Settings::learn_from_work`], the usage counts are deleted with them.
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
    if !settings.learn_from_work {
        usage::forget(&transaction)?;
    }
    transaction.commit()?;
    Ok(())
}

/// A stored setting: its name and its value as JSON text.
type Entry = (String, String);

// The value is read as text, not as JSON, so a value that no longer parses only loses its own
// setting instead of failing the whole query.
fn read_entry(row: &Row<'_>) -> rusqlite::Result<Entry> {
    Ok((row.get("key")?, row.get("value")?))
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
    use serde_json::json;

    use super::*;
    use crate::services::database::Database;

    fn tags(tags: &[&str]) -> Vec<String> {
        tags.iter().map(ToString::to_string).collect()
    }

    #[test]
    fn the_system_language_is_the_first_preferred_one_the_interface_has() {
        let preferred = tags(&["fr-FR", "de-AT", "en-US"]);

        assert_eq!(Language::System.in_interface(&preferred), UiLanguage::De);
    }

    #[test]
    fn falls_back_to_english() {
        assert_eq!(
            Language::System.in_interface(&tags(&["fr-FR"])),
            UiLanguage::En
        );
        assert_eq!(Language::System.in_interface(&[]), UiLanguage::En);
    }

    #[test]
    fn a_chosen_language_wins_over_the_system() {
        assert_eq!(Language::En.in_interface(&tags(&["de-DE"])), UiLanguage::En);
    }

    #[test]
    fn keeps_the_menu_bar_icon_without_a_dock_icon() {
        let hidden = Settings {
            show_menu_bar_icon: false,
            ..Settings::default()
        };
        let both_hidden = Settings {
            show_dock_icon: false,
            ..hidden.clone()
        };

        assert!(!hidden.shows_menu_bar_icon());
        assert!(both_hidden.shows_menu_bar_icon());
    }

    fn changed() -> Settings {
        Settings {
            trigger: Trigger::Shortcut {
                keys: vec!["Meta".to_owned(), "Shift".to_owned(), "m".to_owned()],
            },
            show_menu_bar_icon: true,
            show_dock_icon: false,
            language: Language::De,
            learn_from_work: true,
        }
    }

    fn loaded(database: &Database) -> Settings {
        database
            .with(|connection| load(connection))
            .expect("the settings load")
    }

    fn saved(database: &Database, settings: &Settings) {
        database
            .with(|connection| save(connection, settings))
            .expect("the settings are saved");
    }

    fn stored(database: &Database) -> Vec<Entry> {
        let sql = "SELECT key, value FROM settings ORDER BY key";

        database
            .with(|connection| Ok(query_all(connection, sql, (), read_entry)?))
            .expect("the stored settings are read")
    }

    fn insert(database: &Database, key: &str, value: &str) {
        let sql = "INSERT INTO settings (key, value) VALUES (?1, ?2)";

        database
            .with(|connection| Ok(connection.execute(sql, (key, value))?))
            .expect("a setting is stored");
    }

    #[test]
    fn reaches_the_frontend_in_camel_case() {
        assert_eq!(
            serde_json::to_value(changed()).expect("the settings serialize"),
            json!({
                "trigger": { "kind": "shortcut", "keys": ["Meta", "Shift", "m"] },
                "showMenuBarIcon": true,
                "showDockIcon": false,
                "language": "de",
                "learnFromWork": true,
            }),
        );
        assert_eq!(
            serde_json::to_value(Trigger::HoldCommand).expect("a trigger serializes"),
            json!({ "kind": "holdCommand" }),
        );
    }

    #[test]
    fn rejects_unknown_fields_from_the_frontend() {
        let sent = json!({
            "trigger": { "kind": "holdCommand" },
            "showMenuBarIcon": true,
            "showDockIcon": true,
            "language": "system",
            "learnFromWork": false,
            "showDockIcons": false,
        });

        assert!(serde_json::from_value::<Settings>(sent).is_err());
    }

    #[test]
    fn starts_with_the_defaults() {
        let database = Database::in_memory();

        assert_eq!(loaded(&database), Settings::default());
    }

    #[test]
    fn loads_what_was_saved() {
        let database = Database::in_memory();

        saved(&database, &changed());

        assert_eq!(loaded(&database), changed());
    }

    #[test]
    fn stores_only_what_differs_from_the_defaults() {
        let database = Database::in_memory();

        saved(&database, &changed());

        assert_eq!(
            stored(&database),
            [
                ("language".to_owned(), r#""de""#.to_owned()),
                ("learnFromWork".to_owned(), "true".to_owned()),
                ("showDockIcon".to_owned(), "false".to_owned()),
                (
                    "trigger".to_owned(),
                    r#"{"keys":["Meta","Shift","m"],"kind":"shortcut"}"#.to_owned(),
                ),
            ],
        );
    }

    #[test]
    fn forgets_a_setting_changed_back_to_its_default() {
        let database = Database::in_memory();

        saved(&database, &changed());
        saved(&database, &Settings::default());

        assert_eq!(stored(&database), []);
    }

    fn count_use(database: &Database) {
        let sql = "INSERT INTO usage (shortcut_id, layout, day, by_menu) VALUES ('macos/Meta+m', 'German', 20000, 1)";

        database
            .with(|connection| Ok(connection.execute(sql, ())?))
            .expect("a use is counted");
    }

    fn uses(database: &Database) -> i64 {
        database
            .with(|connection| {
                Ok(connection.query_row("SELECT count(*) FROM usage", (), |row| row.get(0))?)
            })
            .expect("the usage counts are counted")
    }

    #[test]
    fn learns_from_work_only_once_it_is_turned_on() {
        assert!(!Settings::default().learn_from_work);
    }

    #[test]
    fn keeps_the_usage_counts_while_learning_from_work() {
        let database = Database::in_memory();

        count_use(&database);
        saved(&database, &changed());

        assert_eq!(uses(&database), 1);
    }

    #[test]
    fn deletes_the_usage_counts_when_learning_from_work_is_off() {
        let database = Database::in_memory();

        count_use(&database);
        saved(&database, &Settings::default());

        assert_eq!(uses(&database), 0);
    }

    #[test]
    fn keeps_the_default_where_a_stored_value_no_longer_fits() {
        let database = Database::in_memory();

        insert(&database, "showDockIcon", r#""no""#);
        insert(&database, "trigger", r#"{"kind":"doubleTap"}"#);
        insert(&database, "showDockIcons", "false");
        insert(&database, "showMenuBarIcon", "false");
        insert(&database, "language", r#""fr""#);

        assert_eq!(
            loaded(&database),
            Settings {
                show_menu_bar_icon: false,
                ..Settings::default()
            },
        );
    }
}
