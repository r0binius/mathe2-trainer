//! Build script: generates Tauri's context (config, assets, capabilities) at compile time.

use tauri_build::{AppManifest, Attributes};

/// The app's own commands. Tauri generates an `allow-…` permission for each, and a window can only
/// invoke the ones its capability grants.
const COMMANDS: &[&str] = &["get_settings", "set_settings"];

fn main() -> Result<(), Box<dyn std::error::Error>> {
    Ok(tauri_build::try_build(
        Attributes::new().app_manifest(AppManifest::new().commands(COMMANDS)),
    )?)
}
