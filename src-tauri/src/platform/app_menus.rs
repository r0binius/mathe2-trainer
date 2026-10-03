//! Finding the app the user works in and reading its menus, and the trait that does it.

use serde::Serialize;

use crate::error::AppError;
use crate::platform::Access;

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

/// A shortcut in an app's menus.
#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
pub struct MenuShortcut {
    /// The menu item's title, such as "New Note".
    pub title: String,
    /// The keys, named as in the shortcut data: modifiers in ⌃⌥⇧⌘ order, then the key, such as
    /// `["Shift", "Meta", "n"]`.
    pub keys: Vec<String>,
}

/// The shortcuts in one of an app's menus, those of its submenus included.
#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
pub struct MenuGroup {
    /// The menu's title in the menu bar, such as "File".
    pub title: String,
    /// The shortcuts in menu order.
    pub shortcuts: Vec<MenuShortcut>,
}

/// The apps in the session and their menus.
pub trait AppMenus {
    /// The app the user works in: the one in front, or, when that's this app, the one whose window
    /// is topmost. `None` if no other app has a window.
    fn app_in_front(&self) -> Option<RunningApp>;

    /// Whether the user lets the app read other apps' menus.
    fn access(&self) -> Access;

    /// Asks the user to let the app read other apps' menus, in the system's settings. The first
    /// time, the system also shows its own prompt.
    ///
    /// # Errors
    ///
    /// Returns a lookup error if the system's settings can't be opened.
    fn ask_for_access(&self) -> Result<(), AppError>;

    /// The shortcuts in the menus of the app running as `process`, by menu, in menu bar order.
    /// Slow for apps with many menus, so it's called off the main thread.
    ///
    /// # Errors
    ///
    /// Returns a lookup error if access isn't granted, or the app has no menus or doesn't answer.
    fn read(&self, process: i32) -> Result<Vec<MenuGroup>, AppError>;
}
