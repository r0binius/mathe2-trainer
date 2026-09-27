//! Binary entry point: starts the app. All setup lives in the library crate.

fn main() -> tauri::Result<()> {
    mouseless::run()
}
