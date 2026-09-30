//! Builds the Tauri app: its plugins, managed state, commands, menus and menu bar icon.

use std::sync::Arc;

use tauri::{Manager, RunEvent};

use super::coordinator::Event;
use super::settings::apply_settings;
use super::trigger::{self, Triggers};
use super::{layout, menu, tray, windows};
use crate::error::AppError;
use crate::services::database::Database;
use crate::services::settings::{self, UiLanguage};
use crate::{commands, platform};

/// Builds and runs the app until it quits.
///
/// # Errors
///
/// Returns an error if Tauri fails to start or stops with an error.
pub fn run() -> tauri::Result<()> {
    tauri::Builder::default()
        // First, so a second launch stops before it sets anything up.
        .plugin(tauri_plugin_single_instance::init(
            |app, _arguments, _directory| {
                windows::report(app, Event::LaunchedAgain);
            },
        ))
        .plugin(tauri_plugin_autostart::Builder::new().build())
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
        .on_menu_event(menu::report_choice)
        .setup(|app| {
            // Managed first: a layout change asks for it from the moment layouts are watched.
            app.manage(Triggers::default());
            let directory = app
                .path()
                .app_data_dir()
                .map_err(|source| AppError::FindDataDirectory { source })?;
            let database = Arc::new(Database::open_in(&directory)?);
            let settings = database.with(|connection| settings::load(connection))?;
            app.manage(database);
            let platform = platform::current();
            layout::follow_changes(app.handle(), &platform)?;
            app.manage(platform);
            windows::report_window_events(app.handle())?;
            // English until the settings are applied, right after.
            tray::create(
                app.handle(),
                &menu::icon_menu(app.handle(), UiLanguage::En)?,
            )?;
            apply_settings(app.handle(), &settings);
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
