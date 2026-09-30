//! The menu bar icon: a click opens or closes the popover, a right click opens its menu.

use tauri::menu::{Menu, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, include_image};
use tauri_plugin_log::log;

use super::popover;

/// Adds the icon to the menu bar.
///
/// # Errors
///
/// Returns an error if macOS doesn't let the app add the icon or its menu.
pub fn create(app: &AppHandle) -> tauri::Result<TrayIcon> {
    let menu = Menu::with_items(
        app,
        &[
            &PredefinedMenuItem::about(app, None, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::quit(app, None)?,
        ],
    )?;

    TrayIconBuilder::new()
        // A template image is drawn in the menu bar's text color, in light and dark mode.
        .icon(include_image!("icons/tray.png"))
        .icon_as_template(true)
        .tooltip("Mouseless")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(toggle_on_click)
        .build(app)
}

/// Opens or closes the popover when the icon is clicked, once the button comes back up like a
/// menu bar item does.
#[expect(
    clippy::needless_pass_by_value,
    reason = "Tauri passes tray events by value"
)]
fn toggle_on_click(tray: &TrayIcon, event: TrayIconEvent) {
    if let TrayIconEvent::Click {
        rect,
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
    } = event
        && let Err(error) = popover::toggle(tray.app_handle(), rect)
    {
        log::error!("cannot open or close the popover: {error}");
    }
}
