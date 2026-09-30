//! The commands the frontend invokes. Each one only calls a service and returns its result, doing
//! the database work on a blocking thread ([`Database::run`](crate::services::database::Database::run)).

pub mod keymap;
pub mod progress;
pub mod settings;
