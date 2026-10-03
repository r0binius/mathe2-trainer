//! What the popover looks up: the app it opens over, found before this app takes the focus.

use std::sync::{Mutex, PoisonError};

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_log::log;

use super::popover;
use crate::error::AppError;
use crate::platform::{Access, MenuGroup, Platform, RunningApp};

/// The event that tells the popover what it opens over, sent to it alone.
const POPOVER_OPENED: &str = "popover-opened";

/// The app the popover opened over last, whose menus it reads. Kept here, so the webview never
/// chooses which process is read.
#[derive(Debug, Default)]
pub struct AppInFrontState(Mutex<Option<RunningApp>>);

/// What the popover opens over, as `popover-opened` carries it.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct Opened {
    /// The app the user works in, if any other app has a window.
    #[serde(skip_serializing_if = "Option::is_none")]
    app: Option<AppInFront>,
    /// Whether its menus can be read.
    menu_access: Access,
}

/// The app the popover opens over, without its process, which the webview has no use for.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct AppInFront {
    name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    bundle_id: Option<String>,
}

impl From<RunningApp> for AppInFront {
    fn from(app: RunningApp) -> Self {
        Self {
            name: app.name,
            bundle_id: app.bundle_id,
        }
    }
}

/// Tells the popover which app it opens over, and whether that app's menus can be read. Called
/// before it opens, while the app is still in front.
///
/// A failure is only logged: the popover still opens, showing what it showed last.
pub fn tell_popover(app: &AppHandle) {
    let menus = &app.state::<Platform>().menus;
    let in_front = menus.app_in_front();
    let opened = Opened {
        app: in_front.clone().map(AppInFront::from),
        menu_access: menus.access(),
    };
    // A panic while holding the lock leaves only an app that may have quit, so carry on.
    *app.state::<AppInFrontState>()
        .0
        .lock()
        .unwrap_or_else(PoisonError::into_inner) = in_front;

    if let Err(error) = app.emit_to(popover::LABEL, POPOVER_OPENED, opened) {
        log::error!("cannot tell the popover what it opens over: {error}");
    }
}

/// The shortcuts in the menus of the app the popover opened over last, read on a thread meant for
/// blocking work: a big menu bar takes a moment.
///
/// # Errors
///
/// Returns a lookup error if the popover hasn't opened over an app, or its menus can't be read.
pub async fn read_menus(app: AppHandle) -> Result<Vec<MenuGroup>, AppError> {
    let in_front = app
        .state::<AppInFrontState>()
        .0
        .lock()
        .unwrap_or_else(PoisonError::into_inner)
        .clone()
        .ok_or_else(|| AppError::lookup("the popover didn't open over an app"))?;

    tauri::async_runtime::spawn_blocking(move || {
        app.state::<Platform>().menus.read(in_front.process)
    })
    .await
    .map_err(|error| AppError::lookup(format!("the reading stopped: {error}")))?
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    #[test]
    fn reaches_the_popover_in_camel_case() {
        let opened = Opened {
            app: Some(AppInFront {
                name: "Notizen".to_owned(),
                bundle_id: Some("com.apple.Notes".to_owned()),
            }),
            menu_access: Access::Denied,
        };

        assert_eq!(
            serde_json::to_value(&opened).expect("the payload serializes"),
            json!({
                "app": { "name": "Notizen", "bundleId": "com.apple.Notes" },
                "menuAccess": "denied",
            }),
        );
    }

    #[test]
    fn leaves_out_what_is_missing() {
        let opened = Opened {
            app: None,
            menu_access: Access::Granted,
        };

        assert_eq!(
            serde_json::to_value(&opened).expect("the payload serializes"),
            json!({ "menuAccess": "granted" }),
        );
    }
}
