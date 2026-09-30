//! Builds the Tauri app: its plugins, managed state, commands, menus and menu bar icon.

use std::sync::Arc;

use tauri::{Manager, RunEvent};

use super::coordinator::Event;
use super::trigger::{self, Triggers};
use super::{menu, tray, windows};
use crate::error::AppError;
use crate::services::database::Database;
use crate::services::settings;
use crate::{commands, platform};

/// Builds and runs the app until it quits.
///
/// # Errors
///
/// Returns an error if Tauri fails to start or stops with an error.
pub fn run() -> tauri::Result<()> {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(trigger::on_shortcut)
                .build(),
        )
        .menu(menu::app_menu)
        .on_menu_event(menu::report_choice)
        .setup(|app| {
            // Managed first: a layout change asks for it from the moment layouts are watched.
            app.manage(Triggers::default());
            let directory = app
                .path()
                .app_data_dir()
                .map_err(|source| AppError::FindDataDirectory { source })?;
            let database = Arc::new(Database::open_in(&directory)?);
            let trigger = database
                .with(|connection| settings::load(connection))?
                .trigger;
            app.manage(database);
            let platform = platform::current();
            commands::keymap::emit_changes(app.handle(), &platform)?;
            app.manage(platform);
            windows::report_window_events(app.handle())?;
            tray::create(app.handle())?;
            trigger::apply(app.handle(), trigger);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::keymap::get_keymap,
            commands::progress::load_progress,
            commands::progress::save_set_progress,
            commands::progress::record_review,
            commands::progress::replace_progress,
            commands::progress::reset_progress,
            commands::settings::get_settings,
            commands::settings::set_settings,
            commands::windows::dismiss_popover,
        ])
        .build(tauri::generate_context!())?
        .run(|app, event| {
            if let RunEvent::Reopen { .. } = event {
                windows::report(app, Event::DockClicked);
            }
        });
    Ok(())
}
