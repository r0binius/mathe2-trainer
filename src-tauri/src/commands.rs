//! The commands the frontend invokes. Each one only calls a service and returns its result.

#![expect(
    clippy::needless_pass_by_value,
    reason = "Tauri passes command arguments by value, `State` included"
)]

pub mod settings;
