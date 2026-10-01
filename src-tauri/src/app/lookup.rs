//! What the popover looks up: the app it opens over, found before this app takes the focus.

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_log::log;

use super::popover;
use crate::platform::{MenuAccess, Platform, RunningApp};

/// The event that tells the popover what it opens over, sent to it alone.
const POPOVER_OPENED: &str = "popover-opened";

/// What the popover opens over, as `popover-opened` carries it.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct Opened {
    /// The app the user works in, if any other app has a window.
    #[serde(skip_serializing_if = "Option::is_none")]
    app: Option<AppInFront>,
    /// Whether its menus can be read.
    menu_access: MenuAccess,
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
    let opened = Opened {
        app: menus.app_in_front().map(AppInFront::from),
        menu_access: menus.access(),
    };

    if let Err(error) = app.emit_to(popover::LABEL, POPOVER_OPENED, opened) {
        log::error!("cannot tell the popover what it opens over: {error}");
    }
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
            menu_access: MenuAccess::Denied,
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
            menu_access: MenuAccess::Granted,
        };

        assert_eq!(
            serde_json::to_value(&opened).expect("the payload serializes"),
            json!({ "menuAccess": "granted" }),
        );
    }
}
