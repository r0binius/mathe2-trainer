//! Carries out what the [coordinator](super::coordinator) decides, on the real windows.

use tauri::{AppHandle, Manager, WebviewWindow, WindowEvent};
use tauri_plugin_log::log;

use super::coordinator::{Action, Event, Showing, coordinate};
use super::{lookup, popover, tray};
use crate::error::AppError;

/// The main window's label, as in `tauri.conf.json`.
/// The main window's label, as in `tauri.conf.json` and its capability.
pub const MAIN: &str = "main";

/// The Settings window's label, as in `tauri.conf.json`.
const SETTINGS: &str = "settings";

/// Reports the windows' own events to the coordinator: the popover losing focus, and the main and
/// Settings windows closing, which hides them instead.
///
/// # Errors
///
/// Returns an error if a window is missing.
pub fn report_window_events(app: &AppHandle) -> tauri::Result<()> {
    let handle = app.clone();
    popover::window(app)?.on_window_event(move |event| {
        if let WindowEvent::Focused(false) = event {
            report(&handle, Event::PopoverBlurred);
        }
    });

    hide_on_close(app, MAIN, Event::MainClosing)?;
    hide_on_close(app, SETTINGS, Event::SettingsClosing)
}

/// Lets the coordinator decide what `event` does, and does it.
///
/// # Errors
///
/// Returns a window error if a window is missing or macOS doesn't let the app change it. The
/// actions before the failed one stay done.
pub fn handle(app: &AppHandle, event: Event) -> Result<(), AppError> {
    showing(app)
        .and_then(|showing| {
            coordinate(showing, event)
                .into_iter()
                .try_for_each(|action| apply(app, action))
        })
        .map_err(|source| AppError::Window { source })
}

/// [`handle`]s an event that has no one to return an error to, and logs a failure instead.
pub fn report(app: &AppHandle, event: Event) {
    if let Err(error) = handle(app, event) {
        log::error!("{error}");
    }
}

fn showing(app: &AppHandle) -> tauri::Result<Showing> {
    Ok(Showing {
        popover: popover::window(app)?.is_visible()?,
        main: main(app)?.is_visible()?,
        settings: window(app, SETTINGS)?.is_visible()?,
    })
}

fn apply(app: &AppHandle, action: Action) -> tauri::Result<()> {
    match action {
        Action::OpenPopover => {
            lookup::tell_popover(app);
            popover::open_below(&popover::window(app)?, tray::area(app)?)
        }
        Action::ClosePopover => popover::window(app)?.hide(),
        Action::ReturnFocus => app.hide(),
        Action::ShowMain => bring_forward(&main(app)?),
        Action::HideMain => main(app)?.hide(),
        Action::ShowSettings => bring_forward(&window(app, SETTINGS)?),
        Action::HideSettings => window(app, SETTINGS)?.hide(),
    }
}

/// Makes closing the window with `label` hide it, and tells the coordinator as `event`.
fn hide_on_close(app: &AppHandle, label: &str, event: Event) -> tauri::Result<()> {
    let handle = app.clone();

    window(app, label)?.on_window_event(move |window_event| {
        if let WindowEvent::CloseRequested { api, .. } = window_event {
            api.prevent_close();
            report(&handle, event);
        }
    });
    Ok(())
}

fn bring_forward(window: &WebviewWindow) -> tauri::Result<()> {
    window.show()?;
    window.set_focus()
}

fn main(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    window(app, MAIN)
}

fn window(app: &AppHandle, label: &str) -> tauri::Result<WebviewWindow> {
    app.get_webview_window(label)
        .ok_or(tauri::Error::WebviewNotFound)
}
