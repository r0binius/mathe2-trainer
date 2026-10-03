//! The IDs and times of stored progress, as newtypes checked where the webview sends them.
//!
//! Tauri treats the webview as untrusted, so deserializing a value checks it, the same way the
//! frontend's decoders do. What the database holds was checked on its way in, so reading it back
//! doesn't check again: a row that no longer fits reaches the frontend's decoder, which skips it
//! instead of failing all progress.

use rusqlite::ToSql;
use rusqlite::types::{FromSql, FromSqlResult, ToSqlOutput, ValueRef};
use serde::{Deserialize, Serialize};

/// Why a value from the webview was rejected.
#[derive(Debug, thiserror::Error)]
#[error("invalid {value}: {reason}")]
pub struct InvalidValue {
    /// Which kind of value, such as "shortcut ID".
    value: &'static str,
    /// What it's missing.
    reason: String,
}

impl InvalidValue {
    /// Rejects a `value` of the given kind for the given `reason`.
    #[must_use]
    pub fn new(value: &'static str, reason: &str) -> Self {
        let reason = reason.to_owned();
        Self { value, reason }
    }
}

/// Identifies a shortcut of an app, such as `vscodium/Meta+k|Meta+t`, as the frontend's
/// `ShortcutId`: the app's ID and the shortcut's keys, split by `/`.
#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd, Deserialize, Serialize)]
#[serde(try_from = "String")]
pub struct ShortcutId(String);

impl ShortcutId {
    /// A shortcut ID as the database stores it, checked when it came in.
    #[must_use]
    pub fn stored(id: String) -> Self {
        Self(id)
    }
}

impl TryFrom<String> for ShortcutId {
    type Error = InvalidValue;

    fn try_from(id: String) -> Result<Self, Self::Error> {
        if id.contains('/') {
            Ok(Self(id))
        } else {
            Err(InvalidValue::new(
                "shortcut ID",
                "no `/` between app and keys",
            ))
        }
    }
}

impl ToSql for ShortcutId {
    fn to_sql(&self) -> rusqlite::Result<ToSqlOutput<'_>> {
        self.0.to_sql()
    }
}

impl FromSql for ShortcutId {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        String::column_result(value).map(Self::stored)
    }
}

/// The system's ID of a keyboard layout, such as `com.apple.keylayout.German`. Never empty.
#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd, Deserialize, Serialize)]
#[serde(try_from = "String")]
pub struct LayoutId(String);

impl LayoutId {
    /// A layout ID as the database stores it, checked when it came in.
    #[must_use]
    pub fn stored(id: String) -> Self {
        Self(id)
    }
}

impl TryFrom<String> for LayoutId {
    type Error = InvalidValue;

    fn try_from(id: String) -> Result<Self, Self::Error> {
        if id.is_empty() {
            Err(InvalidValue::new("layout ID", "empty"))
        } else {
            Ok(Self(id))
        }
    }
}

impl ToSql for LayoutId {
    fn to_sql(&self) -> rusqlite::Result<ToSqlOutput<'_>> {
        self.0.to_sql()
    }
}

impl FromSql for LayoutId {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        String::column_result(value).map(Self::stored)
    }
}

/// A point in time, in milliseconds since the Unix epoch. Never before it.
#[derive(Copy, Clone, Debug, Eq, Ord, PartialEq, PartialOrd, Deserialize, Serialize)]
#[serde(try_from = "i64")]
pub struct EpochMillis(i64);

impl EpochMillis {
    /// A time as the database stores it, checked when it came in.
    #[must_use]
    pub const fn stored(millis: i64) -> Self {
        Self(millis)
    }
}

impl TryFrom<i64> for EpochMillis {
    type Error = InvalidValue;

    fn try_from(millis: i64) -> Result<Self, Self::Error> {
        if millis < 0 {
            Err(InvalidValue::new("time", "before 1970"))
        } else {
            Ok(Self(millis))
        }
    }
}

impl ToSql for EpochMillis {
    fn to_sql(&self) -> rusqlite::Result<ToSqlOutput<'_>> {
        self.0.to_sql()
    }
}

impl FromSql for EpochMillis {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        i64::column_result(value).map(Self::stored)
    }
}

/// A local day, counted as the frontend's `localDay` counts it: days since 1970-01-01 in the
/// user's time zone. Never before it.
#[derive(Copy, Clone, Debug, Eq, Ord, PartialEq, PartialOrd, Deserialize)]
#[serde(try_from = "i64")]
pub struct LocalDay(i64);

impl TryFrom<i64> for LocalDay {
    type Error = InvalidValue;

    fn try_from(day: i64) -> Result<Self, Self::Error> {
        if day < 0 {
            Err(InvalidValue::new("day", "before 1970"))
        } else {
            Ok(Self(day))
        }
    }
}

impl ToSql for LocalDay {
    fn to_sql(&self) -> rusqlite::Result<ToSqlOutput<'_>> {
        self.0.to_sql()
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    #[test]
    fn a_shortcut_id_names_its_app_and_keys() {
        let valid = serde_json::from_value::<ShortcutId>(json!("macos/Meta+m"));
        let without_app = serde_json::from_value::<ShortcutId>(json!("Meta+m"));

        assert!(valid.is_ok());
        assert!(without_app.is_err_and(|error| error.to_string().contains("invalid shortcut ID")));
    }

    #[test]
    fn a_layout_id_is_never_empty() {
        assert!(serde_json::from_value::<LayoutId>(json!("com.apple.keylayout.US")).is_ok());
        assert!(serde_json::from_value::<LayoutId>(json!("")).is_err());
    }

    #[test]
    fn a_time_is_never_before_the_epoch() {
        assert!(serde_json::from_value::<EpochMillis>(json!(0)).is_ok());
        assert!(serde_json::from_value::<EpochMillis>(json!(-1)).is_err());
    }

    #[test]
    fn a_day_is_never_before_the_epoch() {
        assert!(serde_json::from_value::<LocalDay>(json!(20_000)).is_ok());
        assert!(serde_json::from_value::<LocalDay>(json!(-1)).is_err());
    }

    #[test]
    fn reaches_the_frontend_as_the_bare_value() {
        let id = ShortcutId::stored("macos/Meta+m".to_owned());

        let id = serde_json::to_value(id).expect("a shortcut ID serializes");
        let time = serde_json::to_value(EpochMillis::stored(1_000)).expect("a time serializes");

        assert_eq!(id, json!("macos/Meta+m"));
        assert_eq!(time, json!(1_000));
    }

    #[test]
    fn reads_back_what_the_database_stores_without_checking_again() {
        let connection =
            rusqlite::Connection::open_in_memory().expect("SQLite opens a database in memory");

        let id: ShortcutId = connection
            .query_row("SELECT 'no-slash'", (), |row| row.get(0))
            .expect("a text column reads as a shortcut ID");

        assert_eq!(id, ShortcutId::stored("no-slash".to_owned()));
    }
}
