//! Applies the settings that take effect outside the webview: the trigger, the Dock and menu bar
//! icons and the language of the menus.

use tauri::AppHandle;
use tauri_plugin_log::log;

use super::{menu, tray, trigger};
use crate::platform;
use crate::services::settings::Settings;

/// Makes the app match `settings`, and logs what fails: each setting applies on its own.
///
/// Runs on the main thread: watching the keyboard, reading the layout and changing menus only work
/// there.
pub fn apply_settings(app: &AppHandle, settings: &Settings) {
    let language = settings
        .language
        .in_interface(&platform::preferred_languages());

    trigger::apply(app, settings.trigger.clone());
    if let Err(error) = app.set_dock_visibility(settings.show_dock_icon) {
        log::error!("cannot show or hide the Dock icon: {error}");
    }
    if let Err(error) = menu::app_menu(app, language).and_then(|menu| app.set_menu(menu)) {
        log::error!("cannot change the app menu: {error}");
    }
    if let Err(error) = menu::icon_menu(app, language)
        .and_then(|menu| tray::update(app, settings.shows_menu_bar_icon(), menu))
    {
        log::error!("cannot change the menu bar icon: {error}");
    }
}
