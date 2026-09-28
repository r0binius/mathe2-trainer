//! Mouseless: keyboard shortcut training and look-up.
//!
//! The library builds the Tauri app, and `main.rs` only calls [`run`].

// Until the first command returns it (step 4.2). `expect` fails the build once that happens.
#[cfg_attr(not(test), expect(dead_code, reason = "commands arrive in step 4.2"))]
mod error;

/// Builds and runs the app until it quits.
///
/// # Errors
///
/// Returns an error if Tauri fails to start or stops with an error.
pub fn run() -> tauri::Result<()> {
    tauri::Builder::default().run(tauri::generate_context!())
}
