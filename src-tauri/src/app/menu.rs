//! The app menu, and the Options item it shares with the menu bar icon's menu.

use tauri::menu::{Menu, MenuEvent, MenuItem, MenuItemKind, PredefinedMenuItem};
use tauri::{AppHandle, Wry};

use super::coordinator::Event;
use super::windows;

/// The Options item's ID, in both menus.
const OPTIONS: &str = "options";

/// Where Options goes in the app menu: after About and its separator, as in other Mac apps.
const OPTIONS_POSITION: usize = 2;

/// macOS's standard app menu, with Options (⌘,) added.
///
/// # Errors
///
/// Returns an error if macOS doesn't let the app build the menu.
pub fn app_menu(app: &AppHandle) -> tauri::Result<Menu<Wry>> {
    let menu = Menu::default(app)?;

    // The first submenu is the one named after the app.
    if let Some(MenuItemKind::Submenu(app_submenu)) = menu.items()?.first() {
        app_submenu.insert_items(
            &[&options_item(app)?, &PredefinedMenuItem::separator(app)?],
            OPTIONS_POSITION,
        )?;
    }
    Ok(menu)
}

/// The Options item, which opens the options in the main window.
///
/// # Errors
///
/// Returns an error if macOS doesn't let the app create the item.
pub fn options_item(app: &AppHandle) -> tauri::Result<MenuItem<Wry>> {
    MenuItem::with_id(app, OPTIONS, "Options…", true, Some("CmdOrCtrl+,"))
}

/// Tells the coordinator when Options was chosen, from either menu.
#[expect(
    clippy::needless_pass_by_value,
    reason = "Tauri passes menu events by value"
)]
pub fn report_choice(app: &AppHandle, event: MenuEvent) {
    if event.id() == OPTIONS {
        windows::report(app, Event::OptionsChosen);
    }
}
