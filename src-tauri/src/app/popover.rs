//! The popover: a small window below the menu bar icon for looking up shortcuts.
//!
//! `tauri.conf.json` creates it hidden at startup, so it's loaded before it first opens.

use tauri::{
    AppHandle, Manager, Monitor, PhysicalPosition, PhysicalRect, PhysicalSize, Rect, WebviewWindow,
    WindowEvent,
};
use tauri_plugin_log::log;

/// The popover's window label, as in `tauri.conf.json` and its capability.
const LABEL: &str = "popover";

/// Opens the popover below the menu bar icon at `icon`, or closes it if it's open.
///
/// # Errors
///
/// Returns an error if the popover window is missing or macOS doesn't let the app move, show or
/// hide it.
pub fn toggle(app: &AppHandle, icon: Rect) -> tauri::Result<()> {
    let popover = window(app)?;

    if popover.is_visible()? {
        popover.hide()
    } else {
        open_below(&popover, physical(icon))
    }
}

/// Closes the popover whenever it loses focus, like a menu: clicking anywhere else closes it.
///
/// # Errors
///
/// Returns an error if the popover window is missing.
pub fn hide_on_blur(app: &AppHandle) -> tauri::Result<()> {
    let popover = window(app)?;
    let handle = popover.clone();

    popover.on_window_event(move |event| {
        if let WindowEvent::Focused(false) = event
            && let Err(error) = handle.hide()
        {
            log::error!("cannot close the popover: {error}");
        }
    });
    Ok(())
}

fn window(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    app.get_webview_window(LABEL)
        .ok_or(tauri::Error::WebviewNotFound)
}

fn open_below(popover: &WebviewWindow, icon: PhysicalRect<i32, u32>) -> tauri::Result<()> {
    let monitors = popover.available_monitors()?;

    // Without a screen under the icon, the popover opens where it was last.
    if let Some(monitor) = monitors
        .iter()
        .find(|monitor| shows(monitor, icon.position))
    {
        let position = below(icon, popover.outer_size()?, *monitor.work_area());
        popover.set_position(position)?;
    }
    popover.show()?;
    popover.set_focus()
}

/// The icon's place in physical pixels. On macOS, the tray already reports it in physical pixels,
/// so the scale factor of `1.0` only satisfies the conversion.
fn physical(icon: Rect) -> PhysicalRect<i32, u32> {
    PhysicalRect {
        position: icon.position.to_physical(1.0),
        size: icon.size.to_physical(1.0),
    }
}

/// Whether `point` lies on the monitor's screen, menu bar included.
fn shows(monitor: &Monitor, point: PhysicalPosition<i32>) -> bool {
    let screen = PhysicalRect {
        position: *monitor.position(),
        size: *monitor.size(),
    };

    contains(screen, point)
}

fn contains(area: PhysicalRect<i32, u32>, point: PhysicalPosition<i32>) -> bool {
    let right = area.position.x.saturating_add(signed(area.size.width));
    let bottom = area.position.y.saturating_add(signed(area.size.height));

    (area.position.x..right).contains(&point.x) && (area.position.y..bottom).contains(&point.y)
}

/// Where the popover goes: right below the icon and centred on it, but moved left or right to stay
/// inside the `area` the screen leaves to windows.
fn below(
    icon: PhysicalRect<i32, u32>,
    popover: PhysicalSize<u32>,
    area: PhysicalRect<i32, u32>,
) -> PhysicalPosition<i32> {
    let centred = icon
        .position
        .x
        .saturating_add(signed(icon.size.width) / 2)
        .saturating_sub(signed(popover.width) / 2);
    let rightmost = area
        .position
        .x
        .saturating_add(signed(area.size.width))
        .saturating_sub(signed(popover.width));

    PhysicalPosition {
        // Not `clamp`, which panics when the popover is wider than the area: then its left edge wins.
        x: centred.min(rightmost).max(area.position.x),
        y: icon.position.y.saturating_add(signed(icon.size.height)),
    }
}

/// A size as a coordinate. No screen is 2³¹ pixels wide, so the saturation never happens.
fn signed(length: u32) -> i32 {
    i32::try_from(length).unwrap_or(i32::MAX)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A 1512×982 screen whose menu bar is 74 pixels high, like a 14-inch Mac notebook at 2×.
    const SCREEN: PhysicalRect<i32, u32> = rect(0, 74, 1512, 908);
    const POPOVER: PhysicalSize<u32> = PhysicalSize {
        width: 600,
        height: 960,
    };

    const fn rect(x: i32, y: i32, width: u32, height: u32) -> PhysicalRect<i32, u32> {
        PhysicalRect {
            position: PhysicalPosition { x, y },
            size: PhysicalSize { width, height },
        }
    }

    #[test]
    fn opens_centred_right_below_the_icon() {
        let icon = rect(700, 0, 60, 74);

        assert_eq!(
            below(icon, POPOVER, SCREEN),
            PhysicalPosition { x: 430, y: 74 }
        );
    }

    #[test]
    fn stays_on_screen_below_an_icon_near_the_right_edge() {
        let icon = rect(1400, 0, 60, 74);

        assert_eq!(below(icon, POPOVER, SCREEN).x, 912);
    }

    #[test]
    fn stays_on_screen_below_an_icon_near_the_left_edge() {
        let icon = rect(20, 0, 60, 74);

        assert_eq!(below(icon, POPOVER, SCREEN).x, 0);
    }

    #[test]
    fn keeps_its_left_edge_on_a_screen_narrower_than_itself() {
        let icon = rect(100, 0, 60, 74);

        assert_eq!(below(icon, POPOVER, rect(-400, 74, 400, 908)).x, -400);
    }

    #[test]
    fn finds_the_screen_an_icon_is_on() {
        let left = rect(-1920, 0, 1920, 1080);

        assert!(contains(left, PhysicalPosition { x: -1, y: 0 }));
        assert!(!contains(left, PhysicalPosition { x: 0, y: 0 }));
    }
}
