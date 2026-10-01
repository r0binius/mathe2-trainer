//! The implementations of the traits for the system the app is built for.

#[cfg(target_os = "macos")]
use crate::platform::macos;
use crate::platform::{AppMenus, KeymapSource, ModifierHold};

/// The platform's implementations of the traits, for the system the app is built for.
pub struct Platform {
    /// Reads the keyboard layout.
    pub keymap: Box<dyn KeymapSource + Send + Sync>,
    /// Watches for ⌘ held on its own.
    pub modifier_hold: Box<dyn ModifierHold + Send + Sync>,
    /// Finds the app the user works in, and reads its menus.
    pub menus: Box<dyn AppMenus + Send + Sync>,
}

/// The implementations for macOS.
#[cfg(target_os = "macos")]
#[must_use]
pub fn current() -> Platform {
    Platform {
        keymap: Box::new(macos::SystemKeymap::default()),
        modifier_hold: Box::new(macos::SystemModifierHold::default()),
        menus: Box::new(macos::SystemAppMenus),
    }
}
