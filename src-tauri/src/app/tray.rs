//! The menu bar icon: a click opens or closes the popover, a right click opens its menu.

use tauri::menu::{Menu, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, PhysicalRect, Rect, include_image};

use super::coordinator::Event;
use super::{menu, windows};

/// The menu bar icon's ID, to find it again.
const ID: &str = "menu-bar-icon";

/// Adds the icon to the menu bar. Its Options item reaches the app's menu handler.
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
            &menu::options_item(app)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::quit(app, None)?,
        ],
    )?;

    TrayIconBuilder::with_id(ID)
        // A template image is drawn in the menu bar's text color, in light and dark mode.
        .icon(include_image!("icons/tray.png"))
        .icon_as_template(true)
        .tooltip("Mouseless")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(report_click)
        .build(app)
}

/// Where the icon is on screen, in physical pixels; `None` without an icon.
///
/// # Errors
///
/// Returns an error if macOS doesn't say where the icon is.
pub fn area(app: &AppHandle) -> tauri::Result<Option<PhysicalRect<i32, u32>>> {
    app.tray_by_id(ID)
        .map(|icon| icon.rect())
        .transpose()
        .map(|rect| rect.flatten().map(physical))
}

/// Tells the coordinator the icon was clicked, once the button comes back up like a menu bar
/// item does.
#[expect(
    clippy::needless_pass_by_value,
    reason = "Tauri passes tray events by value"
)]
fn report_click(tray: &TrayIcon, event: TrayIconEvent) {
    if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
    } = event
    {
        windows::report(tray.app_handle(), Event::IconClicked);
    }
}

/// The icon's place in physical pixels. On macOS, the tray already reports it in physical pixels,
/// so the scale factor of `1.0` only satisfies the conversion.
fn physical(icon: Rect) -> PhysicalRect<i32, u32> {
    PhysicalRect {
        position: icon.position.to_physical(1.0),
        size: icon.size.to_physical(1.0),
    }
}
