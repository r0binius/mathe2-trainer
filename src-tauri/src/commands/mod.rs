//! The commands the frontend invokes. Each one only calls a service or the window coordinator and
//! returns its result, doing the database work on a blocking thread
//! ([`Database::run`](crate::services::database::Database::run)).

pub mod coach;
pub mod keymap;
pub mod lookup;
pub mod progress;
pub mod settings;
pub mod windows;
