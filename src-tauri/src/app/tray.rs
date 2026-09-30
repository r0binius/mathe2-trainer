//! The menu bar icon: a click opens or closes the popover, a right click opens its menu.

use tauri::menu::Menu;
use tauri::tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, PhysicalRect, Rect, Wry, include_image};

use super::coordinator::Event;
use super::windows;

/// The menu bar icon's ID, to find it again.
const ID: &str = "menu-bar-icon";

/// Adds the icon to the menu bar, with `menu` on a right click. The menu's items reach the app's
/// menu handler.
///
/// # Errors
///
/// Returns an error if macOS doesn't let the app add the icon.
pub fn create(app: &AppHandle, menu: &Menu<Wry>) -> tauri::Result<TrayIcon> {
    TrayIconBuilder::with_id(ID)
        // A template image is drawn in the menu bar's text color, in light and dark mode.
        .icon(include_image!("icons/tray.png"))
        .icon_as_template(true)
        .tooltip("Mouseless")
        .menu(menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(report_click)
        .build(app)
}

/// Shows or hides the icon, and replaces its menu, such as in another language.
///
/// # Errors
///
/// Returns an error if macOS doesn't let the app change the icon.
pub fn update(app: &AppHandle, visible: bool, menu: Menu<Wry>) -> tauri::Result<()> {
    match app.tray_by_id(ID) {
        Some(icon) => {
            icon.set_menu(Some(menu))?;
            icon.set_visible(visible)
        }
        None => Ok(()),
    }
}

/// Where the icon is on screen, in physical pixels; `None` without an icon or while it's hidden,
/// when macOS reports no place or an empty one.
///
/// # Errors
///
/// Returns an error if macOS doesn't say where the icon is.
pub fn area(app: &AppHandle) -> tauri::Result<Option<PhysicalRect<i32, u32>>> {
    app.tray_by_id(ID)
        .map(|icon| icon.rect())
        .transpose()
        .map(|rect| {
            rect.flatten()
                .map(physical)
                .filter(|area| area.size.width > 0 && area.size.height > 0)
        })
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
