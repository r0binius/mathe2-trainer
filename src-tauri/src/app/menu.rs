//! The app menu and the menu bar icon's menu, in the interface's language. Both have a Settings
//! item, which opens the Settings window.

use tauri::menu::{Menu, MenuEvent, MenuItem, PredefinedMenuItem, Submenu};
use tauri::{AppHandle, Wry};

use super::coordinator::Event;
use super::windows;
use crate::services::settings::UiLanguage;

/// The Settings item's ID, in both menus.
const SETTINGS: &str = "settings";

/// Every text of the menus. macOS doesn't translate the items Tauri makes, so they're written
/// here, in the words macOS itself uses.
struct MenuTexts {
    about: &'static str,
    settings: &'static str,
    services: &'static str,
    hide: &'static str,
    hide_others: &'static str,
    show_all: &'static str,
    quit: &'static str,
    edit: &'static str,
    undo: &'static str,
    redo: &'static str,
    cut: &'static str,
    copy: &'static str,
    paste: &'static str,
    select_all: &'static str,
    window: &'static str,
    minimize: &'static str,
    zoom: &'static str,
    close: &'static str,
}

const ENGLISH: MenuTexts = MenuTexts {
    about: "About Mouseless",
    settings: "Settings…",
    services: "Services",
    hide: "Hide Mouseless",
    hide_others: "Hide Others",
    show_all: "Show All",
    quit: "Quit Mouseless",
    edit: "Edit",
    undo: "Undo",
    redo: "Redo",
    cut: "Cut",
    copy: "Copy",
    paste: "Paste",
    select_all: "Select All",
    window: "Window",
    minimize: "Minimize",
    zoom: "Zoom",
    close: "Close Window",
};

const GERMAN: MenuTexts = MenuTexts {
    about: "Über Mouseless",
    settings: "Einstellungen …",
    services: "Dienste",
    hide: "Mouseless ausblenden",
    hide_others: "Andere ausblenden",
    show_all: "Alle einblenden",
    quit: "Mouseless beenden",
    edit: "Bearbeiten",
    undo: "Widerrufen",
    redo: "Wiederholen",
    cut: "Ausschneiden",
    copy: "Kopieren",
    paste: "Einsetzen",
    select_all: "Alles auswählen",
    window: "Fenster",
    minimize: "Im Dock ablegen",
    zoom: "Zoomen",
    close: "Fenster schließen",
};

fn texts(language: UiLanguage) -> &'static MenuTexts {
    match language {
        UiLanguage::En => &ENGLISH,
        UiLanguage::De => &GERMAN,
    }
}

/// The app menu: the app's own items with Settings (⌘,), and the Edit and Window menus, whose
/// items give the webview's text fields their shortcuts, such as ⌘V.
///
/// # Errors
///
/// Returns an error if macOS doesn't let the app build the menu.
pub fn app_menu(app: &AppHandle, language: UiLanguage) -> tauri::Result<Menu<Wry>> {
    let text = texts(language);
    let separator = || PredefinedMenuItem::separator(app);
    let app_submenu = Submenu::with_items(
        app,
        "Mouseless",
        true,
        &[
            &PredefinedMenuItem::about(app, Some(text.about), None)?,
            &separator()?,
            &settings_item(app, text, Some("CmdOrCtrl+,"))?,
            &separator()?,
            &PredefinedMenuItem::services(app, Some(text.services))?,
            &separator()?,
            &PredefinedMenuItem::hide(app, Some(text.hide))?,
            &PredefinedMenuItem::hide_others(app, Some(text.hide_others))?,
            &PredefinedMenuItem::show_all(app, Some(text.show_all))?,
            &separator()?,
            &PredefinedMenuItem::quit(app, Some(text.quit))?,
        ],
    )?;
    let edit = Submenu::with_items(
        app,
        text.edit,
        true,
        &[
            &PredefinedMenuItem::undo(app, Some(text.undo))?,
            &PredefinedMenuItem::redo(app, Some(text.redo))?,
            &separator()?,
            &PredefinedMenuItem::cut(app, Some(text.cut))?,
            &PredefinedMenuItem::copy(app, Some(text.copy))?,
            &PredefinedMenuItem::paste(app, Some(text.paste))?,
            &PredefinedMenuItem::select_all(app, Some(text.select_all))?,
        ],
    )?;
    let window = Submenu::with_items(
        app,
        text.window,
        true,
        &[
            &PredefinedMenuItem::minimize(app, Some(text.minimize))?,
            &PredefinedMenuItem::maximize(app, Some(text.zoom))?,
            &separator()?,
            &PredefinedMenuItem::close_window(app, Some(text.close))?,
        ],
    )?;

    Menu::with_items(app, &[&app_submenu, &edit, &window])
}

/// The menu bar icon's menu: About, Settings and Quit.
///
/// # Errors
///
/// Returns an error if macOS doesn't let the app build the menu.
pub fn icon_menu(app: &AppHandle, language: UiLanguage) -> tauri::Result<Menu<Wry>> {
    let text = texts(language);

    Menu::with_items(
        app,
        &[
            &PredefinedMenuItem::about(app, Some(text.about), None)?,
            &PredefinedMenuItem::separator(app)?,
            &settings_item(app, text, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::quit(app, Some(text.quit))?,
        ],
    )
}

/// Tells the coordinator when Settings was chosen, from either menu.
#[expect(
    clippy::needless_pass_by_value,
    reason = "Tauri passes menu events by value"
)]
pub fn report_choice(app: &AppHandle, event: MenuEvent) {
    if event.id() == SETTINGS {
        windows::report(app, Event::SettingsChosen);
    }
}

fn settings_item(
    app: &AppHandle,
    text: &MenuTexts,
    shortcut: Option<&str>,
) -> tauri::Result<MenuItem<Wry>> {
    MenuItem::with_id(app, SETTINGS, text.settings, true, shortcut)
}
