//! The banner: a small panel below the menu bar that shows a shortcut's keys for a moment after
//! it was chosen from a menu, while learning from work.
//!
//! `tauri.conf.json` creates it hidden and unfocusable, so showing it never activates Mouseless
//! or brings its other windows forward.

use std::sync::{Mutex, MutexGuard, PoisonError};
use std::thread;
use std::time::Duration;

use serde::{Deserialize, Serialize};
use tauri::{
    AppHandle, Emitter, LogicalSize, Manager, PhysicalPosition, PhysicalRect, PhysicalSize,
    WebviewWindow,
};
use tauri_plugin_log::log;

use super::screen::{shows, signed};

/// The banner's window label, as in `tauri.conf.json` and its capability.
pub const LABEL: &str = "banner";

/// The event that tells the banner what to show, sent to it alone.
const BANNER_SHOWN: &str = "banner-shown";

/// How long the banner shows: its page fades it out within this time.
const SHOWN_FOR: Duration = Duration::from_millis(2200);

/// The space between the menu bar and the banner, in points.
const BELOW_MENU_BAR: f64 = 8.0;

/// How many banners were shown, so the wait of an earlier one doesn't hide a newer one. Kept in
/// Tauri's managed state.
#[derive(Debug, Default)]
pub struct Banners(Mutex<u64>);

/// What the banner shows, as the main window sends it and the banner receives it.
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Banner {
    /// The shortcut's title, in the interface's language.
    title: String,
    /// Its keys, named as in the shortcut data.
    keys: Vec<String>,
}

/// Lets clicks pass through the banner to whatever is below it. Called once at startup.
///
/// # Errors
///
/// Returns an error if `tauri.conf.json` didn't create the banner, or macOS refuses.
pub fn prepare(app: &AppHandle) -> tauri::Result<()> {
    window(app)?.set_ignore_cursor_events(true)
}

/// Shows `banner` below the menu bar of the screen the pointer is on, in place of the one before,
/// and hides it after [`SHOWN_FOR`].
///
/// # Errors
///
/// Returns an error if the banner can't be found, placed, told what to show, or shown.
pub fn show(app: &AppHandle, banner: &Banner) -> tauri::Result<()> {
    let window = window(app)?;
    let shown = {
        let mut banners = lock(app);
        *banners = banners.wrapping_add(1);
        *banners
    };

    place(app, &window)?;
    app.emit_to(LABEL, BANNER_SHOWN, banner)?;
    window.show()?;

    let app = app.clone();
    thread::spawn(move || {
        thread::sleep(SHOWN_FOR);
        if *lock(&app) == shown
            && let Err(error) = window.hide()
        {
            log::error!("cannot hide the banner: {error}");
        }
    });
    Ok(())
}

/// Moves the banner below the menu bar of the screen the pointer is on. Without one, it stays
/// where it was last.
fn place(app: &AppHandle, window: &WebviewWindow) -> tauri::Result<()> {
    let pointer = app.cursor_position()?.cast::<i32>();
    let monitors = window.available_monitors()?;

    if let Some(monitor) = monitors.iter().find(|monitor| shows(monitor, pointer)) {
        let gap = LogicalSize::new(0.0, BELOW_MENU_BAR)
            .to_physical::<u32>(monitor.scale_factor())
            .height;
        window.set_position(top_centre(*monitor.work_area(), window.outer_size()?, gap))?;
    }
    Ok(())
}

/// Where the banner goes: centred at the top of the `area` the screen leaves to windows, `gap`
/// below its top edge. A banner wider than the area keeps its left edge on it.
fn top_centre(
    area: PhysicalRect<i32, u32>,
    banner: PhysicalSize<u32>,
    gap: u32,
) -> PhysicalPosition<i32> {
    let margin = signed(area.size.width).saturating_sub(signed(banner.width)) / 2;

    PhysicalPosition {
        x: area.position.x.saturating_add(margin.max(0)),
        y: area.position.y.saturating_add(signed(gap)),
    }
}

fn window(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    app.get_webview_window(LABEL)
        .ok_or(tauri::Error::WebviewNotFound)
}

fn lock(app: &AppHandle) -> MutexGuard<'_, u64> {
    // The count is a single number, so a panic can't leave it half changed.
    app.state::<Banners>()
        .inner()
        .0
        .lock()
        .unwrap_or_else(PoisonError::into_inner)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The area below a 74 pixel menu bar on a 1512×982 screen, like a 14-inch Mac notebook at 2×.
    const AREA: PhysicalRect<i32, u32> = PhysicalRect {
        position: PhysicalPosition { x: 0, y: 74 },
        size: PhysicalSize {
            width: 1512,
            height: 908,
        },
    };

    #[test]
    fn sits_centred_just_below_the_menu_bar() {
        let banner = PhysicalSize {
            width: 720,
            height: 112,
        };

        assert_eq!(
            top_centre(AREA, banner, 16),
            PhysicalPosition { x: 396, y: 90 }
        );
    }

    #[test]
    fn keeps_its_left_edge_on_a_screen_narrower_than_itself() {
        let banner = PhysicalSize {
            width: 2000,
            height: 112,
        };

        assert_eq!(top_centre(AREA, banner, 16).x, 0);
    }

    #[test]
    fn reaches_the_banner_as_its_title_and_keys() {
        let banner = Banner {
            title: "Als Galerie".to_owned(),
            keys: vec!["Meta".to_owned(), "2".to_owned()],
        };

        assert_eq!(
            serde_json::to_value(banner).expect("a banner serializes"),
            serde_json::json!({ "title": "Als Galerie", "keys": ["Meta", "2"] }),
        );
    }
}
