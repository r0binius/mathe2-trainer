//! The implementations of the traits for the system the app is built for.

use crate::platform::KeymapSource;
#[cfg(target_os = "macos")]
use crate::platform::macos;

/// The platform's implementations of the traits, for the system the app is built for.
pub struct Platform {
    /// Reads the keyboard layout.
    pub keymap: Box<dyn KeymapSource + Send + Sync>,
}

/// The implementations for macOS.
#[cfg(target_os = "macos")]
#[must_use]
pub fn current() -> Platform {
    Platform {
        keymap: Box::new(macos::SystemKeymap),
    }
}
