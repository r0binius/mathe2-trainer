//! The error every command returns, and how it reaches the frontend.

use std::io;
use std::path::PathBuf;

use serde::ser::{Serialize, SerializeStruct, Serializer};

/// Something that went wrong in the Rust side of the app.
///
/// Commands return `Result<T, AppError>`, and Tauri sends the error to the frontend as
/// `{ kind, message }` (see [`ErrorKind`]). A variant that wraps another error keeps it in a
/// `source` field, as the [`source`](std::error::Error::source) for logs; one that doesn't says
/// why in a `reason` field.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    /// The system doesn't say where the app's data directory is.
    #[error("cannot find the data directory: {source}")]
    FindDataDirectory {
        /// Why Tauri couldn't resolve it.
        source: tauri::Error,
    },
    /// The app's data directory couldn't be created.
    #[error("cannot create the data directory {}: {source}", path.display())]
    CreateDataDirectory {
        /// Where it should be.
        path: PathBuf,
        /// Why it couldn't be created.
        source: io::Error,
    },
    /// A database query failed.
    #[error("cannot access the database: {source}")]
    Database {
        /// SQLite's error.
        #[from]
        source: rusqlite::Error,
    },
    /// The database couldn't be brought up to this version's schema.
    #[error("cannot migrate the database: {source}")]
    Migration {
        /// Which migration failed, and why.
        #[from]
        source: rusqlite_migration::Error,
    },
    /// Work on the database stopped before it finished, such as by panicking.
    #[error("cannot finish the database work: {source}")]
    Interrupted {
        /// Why the blocking task ended.
        source: tauri::Error,
    },
    /// The keyboard layout couldn't be read from the system.
    #[error("cannot read the keyboard layout: {reason}")]
    Keymap {
        /// What went wrong, for the logs.
        reason: String,
    },
    /// A window couldn't be found, shown, hidden or told something.
    #[error("cannot change a window: {source}")]
    Window {
        /// Why Tauri couldn't do it.
        source: tauri::Error,
    },
}

impl AppError {
    /// A keymap error, with the `reason` for the logs.
    pub fn keymap(reason: impl Into<String>) -> Self {
        Self::Keymap {
            reason: reason.into(),
        }
    }

    /// The kind of this error, as the frontend sees it.
    #[must_use]
    pub fn kind(&self) -> ErrorKind {
        match self {
            Self::FindDataDirectory { .. } | Self::CreateDataDirectory { .. } => ErrorKind::Storage,
            Self::Database { .. } | Self::Migration { .. } | Self::Interrupted { .. } => {
                ErrorKind::Database
            }
            Self::Keymap { .. } => ErrorKind::Keymap,
            Self::Window { .. } => ErrorKind::Window,
        }
    }
}

// Written by hand: a derived impl would send the variant and its cause, but the frontend gets
// only the kind to act on and the message to log.
impl Serialize for AppError {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut error = serializer.serialize_struct("AppError", 2)?;
        error.serialize_field("kind", &self.kind())?;
        error.serialize_field("message", &self.to_string())?;
        error.end()
    }
}

/// What kind of error the frontend received, so it can decide what to show.
///
/// Serialized in camelCase, like the frontend's string union. Several variants of [`AppError`] can
/// share a kind, since the frontend only needs to tell apart what it handles differently.
#[derive(Copy, Clone, Debug, Eq, PartialEq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ErrorKind {
    /// Where the app keeps its data isn't available.
    Storage,
    /// Reading or writing stored data failed.
    Database,
    /// Reading the keyboard layout failed.
    Keymap,
    /// Showing or hiding a window failed.
    Window,
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    #[test]
    fn reaches_the_frontend_as_kind_and_message() {
        let error = AppError::FindDataDirectory {
            source: tauri::Error::UnknownPath,
        };

        assert_eq!(
            serde_json::to_value(&error).expect("an error serializes"),
            json!({
                "kind": "storage",
                "message": "cannot find the data directory: unknown path",
            }),
        );
    }

    #[test]
    fn interrupted_work_counts_as_a_database_error() {
        let error = AppError::Interrupted {
            source: tauri::Error::UnknownPath,
        };

        assert_eq!(error.kind(), ErrorKind::Database);
    }

    #[test]
    fn keeps_its_cause_as_the_source() {
        let error = AppError::FindDataDirectory {
            source: tauri::Error::UnknownPath,
        };

        assert_eq!(
            std::error::Error::source(&error).map(ToString::to_string),
            Some("unknown path".to_owned()),
        );
    }
}
