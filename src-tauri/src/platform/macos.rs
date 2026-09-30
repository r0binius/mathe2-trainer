//! The macOS implementations of the platform traits.

mod input_source;
pub mod keymap;

use crate::error::AppError;
use crate::platform::{KeymapSource, Layout};

/// The keyboard layout selected in macOS.
///
/// It must be read on the main thread, which Tauri runs synchronous commands on.
pub struct SystemKeymap;

impl KeymapSource for SystemKeymap {
    fn current_layout(&self) -> Result<Layout, AppError> {
        input_source::current_layout()
    }
}
