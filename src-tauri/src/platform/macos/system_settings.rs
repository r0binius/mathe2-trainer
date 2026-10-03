//! Opening System Settings where the user allows what Mouseless needs.

use objc2_app_kit::NSWorkspace;
use objc2_foundation::{NSString, NSURL};

/// Privacy & Security → Accessibility, which lets Mouseless read and observe other apps' menus.
pub const ACCESSIBILITY: &str =
    "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility";

/// Privacy & Security → Input Monitoring, which lets Mouseless watch clicks and key presses.
pub const INPUT_MONITORING: &str =
    "x-apple.systempreferences:com.apple.preference.security?Privacy_ListenEvent";

/// Opens System Settings at `pane`, one of this module's constants. Whether macOS opened it.
#[must_use]
pub fn open(pane: &str) -> bool {
    NSURL::URLWithString(&NSString::from_str(pane))
        .is_some_and(|url| NSWorkspace::sharedWorkspace().openURL(&url))
}
