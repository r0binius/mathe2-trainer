//! The apps in the session and their menus, through AppKit and the Accessibility API, as
//! [`AppMenus`].

use objc2_app_kit::{NSRunningApplication, NSWorkspace};
use objc2_foundation::{NSString, NSURL};

use crate::error::AppError;
use crate::platform::macos::{accessibility, menus, window_list};
use crate::platform::{AppMenus, MenuAccess, MenuGroup, RunningApp};

/// System Settings → Privacy & Security → Accessibility.
const ACCESSIBILITY_SETTINGS: &str =
    "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility";

/// Reads the apps in the session from AppKit, and their menus through the Accessibility API.
#[derive(Debug, Default)]
pub struct SystemAppMenus;

impl AppMenus for SystemAppMenus {
    fn app_in_front(&self) -> Option<RunningApp> {
        let own = NSRunningApplication::currentApplication().processIdentifier();
        let frontmost = NSWorkspace::sharedWorkspace()
            .frontmostApplication()
            .map(|app| app.processIdentifier());

        let process = process_in_front(own, frontmost, window_list::window_owners)?;
        running_app(process)
    }

    fn access(&self) -> MenuAccess {
        if accessibility::is_trusted() {
            MenuAccess::Granted
        } else {
            MenuAccess::Denied
        }
    }

    fn ask_for_access(&self) -> Result<(), AppError> {
        accessibility::ask_for_trust();
        let opened = NSURL::URLWithString(&NSString::from_str(ACCESSIBILITY_SETTINGS))
            .is_some_and(|url| NSWorkspace::sharedWorkspace().openURL(&url));

        if opened {
            Ok(())
        } else {
            Err(AppError::lookup(
                "macOS didn't open the Accessibility settings",
            ))
        }
    }

    fn read(&self, process: i32) -> Result<Vec<MenuGroup>, AppError> {
        menus::read_menus(process)
    }
}

/// The process the user works in: the frontmost app's, or, when that's this app (`own`), the
/// owner of the topmost window of another one.
///
/// The window owners are only read when they're needed.
fn process_in_front(
    own: i32,
    frontmost: Option<i32>,
    window_owners: impl FnOnce() -> Vec<i32>,
) -> Option<i32> {
    match frontmost {
        Some(process) if process != own => Some(process),
        _ => window_owners().into_iter().find(|&process| process != own),
    }
}

/// The app running as `process`, unless it has quit since.
fn running_app(process: i32) -> Option<RunningApp> {
    let app = NSRunningApplication::runningApplicationWithProcessIdentifier(process)?;

    Some(RunningApp {
        process,
        name: app.localizedName()?.to_string(),
        bundle_id: app.bundleIdentifier().map(|id| id.to_string()),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    const OWN: i32 = 100;

    #[test]
    fn takes_the_frontmost_app() {
        assert_eq!(process_in_front(OWN, Some(200), || vec![300]), Some(200));
    }

    #[test]
    fn takes_the_topmost_window_of_another_app_when_this_app_is_in_front() {
        assert_eq!(
            process_in_front(OWN, Some(OWN), || vec![OWN, 300, 200]),
            Some(300)
        );
    }

    #[test]
    fn takes_the_topmost_window_when_no_app_is_in_front() {
        assert_eq!(process_in_front(OWN, None, || vec![300]), Some(300));
    }

    #[test]
    fn finds_none_when_only_this_app_has_windows() {
        assert_eq!(process_in_front(OWN, Some(OWN), || vec![OWN]), None);
    }
}
