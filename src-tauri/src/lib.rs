//! Mouseless: keyboard shortcut training and look-up.
//!
//! The library builds the Tauri app, and `main.rs` only calls [`run`].

/// Builds and runs the app until it quits.
///
/// # Errors
///
/// Returns an error if Tauri fails to start or stops with an error.
pub fn run() -> tauri::Result<()> {
    tauri::Builder::default().run(tauri::generate_context!())
}
