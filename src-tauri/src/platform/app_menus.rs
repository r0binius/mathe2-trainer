//! Finding the app the user works in and reading its menus, and the trait that does it.

use serde::Serialize;

use crate::error::AppError;

/// An app running in the user's session.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RunningApp {
    /// Its process ID, which its menus are read through.
    pub process: i32,
    /// Its name in the user's language, such as "Notizen".
    pub name: String,
    /// Its bundle ID, such as `com.apple.Notes`, unless it's a bare executable.
    pub bundle_id: Option<String>,
}

/// Whether the user lets the app read other apps' menus, which macOS grants in Privacy & Security
/// → Accessibility.
#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum MenuAccess {
    /// The user allowed it.
    Granted,
    /// The user hasn't allowed it yet, or turned it off.
    Denied,
}

/// The apps in the session and their menus.
pub trait AppMenus {
    /// The app the user works in: the one in front, or, when that's this app, the one whose window
    /// is topmost. `None` if no other app has a window.
    fn app_in_front(&self) -> Option<RunningApp>;

    /// Whether the user lets the app read other apps' menus.
    fn access(&self) -> MenuAccess;

    /// Asks the user to let the app read other apps' menus, in the system's settings. The first
    /// time, the system also shows its own prompt.
    ///
    /// # Errors
    ///
    /// Returns a lookup error if the system's settings can't be opened.
    fn ask_for_access(&self) -> Result<(), AppError>;
}
