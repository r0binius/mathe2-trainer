//! What the app needs from the operating system, as traits (the ports), and their implementation
//! for the platform the app is built for.
//!
//! The rest of the app works against the traits, so a platform is added without changing it (the
//! Bridge pattern in `architecture.md`).

mod access;
mod app_menus;
mod current;
mod key_code;
mod layout;
mod menu_choices;
mod modifier_hold;

pub use self::access::Access;
pub use self::app_menus::{AppMenus, MenuGroup, MenuShortcut, RunningApp};
pub use self::current::Platform;
pub use self::key_code::KeyCode;
pub use self::layout::{KeyCharacters, Keymap, KeymapSource, Layout};
pub use self::menu_choices::{Frame, MenuChoices, MenuItem, MenuSignal, Point};
pub use self::modifier_hold::{KeyInput, ModifierHold};

#[cfg(target_os = "macos")]
pub mod macos;

#[cfg(target_os = "macos")]
pub use self::current::current;
#[cfg(target_os = "macos")]
pub use self::macos::preferred_languages;
