//! Build script: generates Tauri's context (config, assets, capabilities) at compile time.

use tauri_build::{AppManifest, Attributes};

/// The app's own commands. Tauri generates an `allow-…` permission for each, and a window can only
/// invoke the ones its capability grants.
const COMMANDS: &[&str] = &[
    "get_keymap",
    "load_progress",
    "load_review_log",
    "save_set_progress",
    "record_review",
    "replace_progress",
    "reset_progress",
    "get_settings",
    "set_settings",
    "dismiss_popover",
    "ask_for_menu_access",
    "read_menu_shortcuts",
    "get_coach_access",
    "ask_for_input_access",
    "record_use",
    "show_banner",
    "set_watched_shortcuts",
];

fn main() -> Result<(), Box<dyn std::error::Error>> {
    tauri_build::try_build(Attributes::new().app_manifest(AppManifest::new().commands(COMMANDS)))?;
    Ok(())
}
