//! How often shortcuts are used, counted per day while "Learn from how I work" is on.

use rusqlite::Connection;

/// Deletes every count, as turning the switch off or resetting progress does.
///
/// # Errors
///
/// Returns the database's error if the counts can't be deleted.
pub fn forget(connection: &Connection) -> rusqlite::Result<()> {
    connection.execute("DELETE FROM usage", ())?;
    Ok(())
}
