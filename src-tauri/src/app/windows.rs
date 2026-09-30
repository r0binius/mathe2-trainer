//! Carries out what the [coordinator](super::coordinator) decides, on the real windows.

use tauri::{AppHandle, Emitter, Manager, WebviewWindow, WindowEvent};
use tauri_plugin_log::log;

use super::coordinator::{Action, Event, Showing, coordinate};
use super::{popover, tray};
use crate::error::AppError;

/// The main window's label, as in `tauri.conf.json`.
const MAIN: &str = "main";

/// The event that tells the main window to open its options panel. It carries nothing.
const OPTIONS_REQUESTED: &str = "options-requested";

/// Reports the windows' own events to the coordinator: the popover losing focus, and the main
/// window closing, which hides it instead.
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

    let handle = app.clone();
    main(app)?.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            report(&handle, Event::MainClosing);
        }
    });
    Ok(())
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
    })
}

fn apply(app: &AppHandle, action: Action) -> tauri::Result<()> {
    match action {
        Action::OpenPopover => popover::open_below(&popover::window(app)?, tray::area(app)?),
        Action::ClosePopover => popover::window(app)?.hide(),
        Action::ReturnFocus => app.hide(),
        Action::ShowMain => {
            let main = main(app)?;
            main.show()?;
            main.set_focus()
        }
        Action::HideMain => main(app)?.hide(),
        Action::OpenOptions => app.emit_to(MAIN, OPTIONS_REQUESTED, ()),
    }
}

fn main(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    app.get_webview_window(MAIN)
        .ok_or(tauri::Error::WebviewNotFound)
}
