//! The error every command returns, and how it reaches the frontend.

use serde::ser::{Serialize, SerializeStruct, Serializer};

/// Something that went wrong in the Rust side of the app.
///
/// Commands return `Result<T, AppError>`, and Tauri sends the error to the frontend as
/// `{ kind, message }` (see [`ErrorKind`]). Each variant keeps its cause as the
/// [`source`](std::error::Error::source), for logs.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    /// The app's data directory couldn't be found or created.
    #[error("the data directory is unavailable: {0}")]
    DataDirectory(#[source] tauri::Error),
    /// A database query failed.
    #[error("the database failed: {0}")]
    Database(#[from] rusqlite::Error),
    /// The database couldn't be brought up to this version's schema.
    #[error("the database couldn't be migrated: {0}")]
    Migration(#[from] rusqlite_migration::Error),
    /// Work on the database stopped before it finished, such as by panicking.
    #[error("the database work was interrupted: {0}")]
    Interrupted(#[source] tauri::Error),
}

/// What kind of error the frontend received, so it can decide what to show.
///
/// Serialized in camelCase, like the frontend's string union. Several variants of [`AppError`] can
/// share a kind, since the frontend only needs to tell apart what it handles differently.
#[derive(Clone, Copy, Debug, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ErrorKind {
    /// Where the app keeps its data isn't available.
    Storage,
    /// Reading or writing stored data failed.
    Database,
}

impl AppError {
    /// The kind of this error, as the frontend sees it.
    #[must_use]
    pub fn kind(&self) -> ErrorKind {
        match self {
            Self::DataDirectory(_) => ErrorKind::Storage,
            Self::Database(_) | Self::Migration(_) | Self::Interrupted(_) => ErrorKind::Database,
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

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn reaches_the_frontend_as_kind_and_message() {
        let error = AppError::DataDirectory(tauri::Error::UnknownPath);

        assert_eq!(
            serde_json::to_value(&error).ok(),
            Some(json!({
                "kind": "storage",
                "message": "the data directory is unavailable: unknown path",
            })),
        );
    }

    #[test]
    fn interrupted_work_counts_as_a_database_error() {
        let error = AppError::Interrupted(tauri::Error::UnknownPath);

        assert_eq!(error.kind(), ErrorKind::Database);
    }

    #[test]
    fn keeps_its_cause_as_the_source() {
        let error = AppError::DataDirectory(tauri::Error::UnknownPath);

        assert_eq!(
            std::error::Error::source(&error).map(ToString::to_string),
            Some("unknown path".to_owned()),
        );
    }
}
