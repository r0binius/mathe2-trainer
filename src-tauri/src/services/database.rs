//! The SQLite database that holds settings and progress, and its migrations.

use std::path::Path;
use std::sync::{Mutex, PoisonError};

use rusqlite::types::{FromSql, FromSqlError, FromSqlResult, ToSqlOutput, ValueRef};
use rusqlite::{Connection, Row, ToSql};
use rusqlite_migration::{M, Migrations};
use serde::Serialize;
use serde::de::DeserializeOwned;

use crate::error::AppError;

/// The database file in the app data directory. Debug builds keep their own, so development never
/// touches the progress of an installed build.
const FILE_NAME: &str = if cfg!(debug_assertions) {
    "mouseless-dev.db"
} else {
    "mouseless.db"
};

/// Schema changes in order. Only append: a database remembers how many it has applied (in
/// SQLite's `user_version`), so editing a released one would never reach existing databases.
const MIGRATIONS: &[M<'static>] = &[
    M::up(include_str!("../../migrations/0001_settings.sql")),
    M::up(include_str!("../../migrations/0002_progress.sql")),
];

/// The app's one connection, shared by the commands through Tauri's managed state.
pub struct Database(Mutex<Connection>);

impl Database {
    /// Opens the database in `directory`, creating both if needed, and brings its schema up to
    /// date.
    ///
    /// # Errors
    ///
    /// Returns [`AppError::DataDirectory`] if the directory can't be created, and a database error
    /// if the file can't be opened or migrated.
    pub fn open_in(directory: &Path) -> Result<Self, AppError> {
        std::fs::create_dir_all(directory)
            .map_err(|error| AppError::DataDirectory(error.into()))?;
        Self::migrate(Connection::open(directory.join(FILE_NAME))?)
    }

    /// Opens an empty database in memory, for tests.
    #[cfg(test)]
    pub fn in_memory() -> Result<Self, AppError> {
        Self::migrate(Connection::open_in_memory()?)
    }

    /// Runs `work` with the connection, holding the lock only while it runs.
    ///
    /// # Errors
    ///
    /// Returns what `work` returns.
    pub fn with<T>(
        &self,
        work: impl FnOnce(&mut Connection) -> Result<T, AppError>,
    ) -> Result<T, AppError> {
        // A panic while the lock was held (which poisons it) can't leave the connection half
        // changed: an unfinished transaction rolls back when it's dropped. So the lock is taken
        // over instead of failing every later command.
        let mut connection = self.0.lock().unwrap_or_else(PoisonError::into_inner);
        work(&mut connection)
    }

    /// Brings the connection's schema up to date and wraps it.
    fn migrate(mut connection: Connection) -> Result<Self, AppError> {
        Migrations::from_slice(MIGRATIONS).to_latest(&mut connection)?;
        Ok(Self(Mutex::new(connection)))
    }
}

/// A value stored as JSON text in one column, such as a list.
pub struct Json<T>(pub T);

impl<T: Serialize> ToSql for Json<T> {
    fn to_sql(&self) -> rusqlite::Result<ToSqlOutput<'_>> {
        serde_json::to_string(&self.0)
            .map(ToSqlOutput::from)
            .map_err(|error| rusqlite::Error::ToSqlConversionFailure(error.into()))
    }
}

impl<T: DeserializeOwned> FromSql for Json<T> {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        serde_json::from_str(value.as_str()?)
            .map(Json)
            .map_err(|error| FromSqlError::Other(error.into()))
    }
}

/// Every row `sql` selects, read by `read_row`.
///
/// # Errors
///
/// Returns the database's error if the query fails or a row can't be read.
pub fn query_all<T>(
    connection: &Connection,
    sql: &str,
    read_row: fn(&Row<'_>) -> rusqlite::Result<T>,
) -> rusqlite::Result<Vec<T>> {
    let mut statement = connection.prepare(sql)?;
    statement.query_map((), read_row)?.collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn migrations_are_valid() {
        assert!(Migrations::from_slice(MIGRATIONS).validate().is_ok());
    }

    #[test]
    fn json_columns_read_back_what_was_written() -> Result<(), AppError> {
        let connection = Connection::open_in_memory()?;
        let ids = vec!["macos:cmd+m".to_owned()];

        let Json(read): Json<Vec<String>> =
            connection.query_row("SELECT ?1", (Json(&ids),), |row| row.get(0))?;
        let wrong_shape: rusqlite::Result<Json<Vec<String>>> =
            connection.query_row("SELECT '[1]'", (), |row| row.get(0));

        assert_eq!(read, ids);
        assert!(wrong_shape.is_err());
        Ok(())
    }

    #[test]
    fn reopening_keeps_the_data() -> Result<(), AppError> {
        let directory = std::env::temp_dir().join(format!("mouseless-test-{}", std::process::id()));
        let insert = "INSERT INTO settings (key, value) VALUES ('showDockIcon', 'false')";
        let count = "SELECT count(*) FROM settings";

        Database::open_in(&directory)?.with(|connection| Ok(connection.execute(insert, ())?))?;
        let rows: i64 = Database::open_in(&directory)?
            .with(|connection| Ok(connection.query_row(count, (), |row| row.get(0))?))?;
        std::fs::remove_dir_all(&directory)
            .map_err(|error| AppError::DataDirectory(error.into()))?;

        assert_eq!(rows, 1);
        Ok(())
    }
}
